# Engineering Specification: Stale Data, Failure Recovery & Rate Limit Architecture

This document details the engineering decisions, failure handling mechanisms, and concurrency control implemented in the **SkyWatch ATC** system.

---

## 1. OpenSky Network API Constraints & Rate Limit Management

### 1.1 The Constraints
The OpenSky Network API provides access to aggregated ADS-B and Mode-S transponder data with the following operational constraints:
- **Anonymous Access**:
  - Request rate: **1 request per 10 seconds** per IP address.
  - Daily quota: $\sim 400$ requests per day.
  - Spatial resolution: Bounding box filtering is required to limit payload size.
- **Authenticated Access (API Client Credentials)**:
  - Request rate: Up to 1 request per 5 seconds.
  - Daily quota: $\sim 4,000$ to $8,000$ requests per day.
- **Browser Constraints**:
  - Direct client fetches violate CORS policies or are blocked by OpenSky's CDN.

### 1.2 Multi-Layer Rate Limit Protection
SkyWatch ATC solves these constraints through a four-tiered throttle architecture:

```
[ Browser Client ]
       │
       ▼
1. Page Visibility Filter (Suspends polling when tab is inactive)
       │
       ▼
2. Client Debounce Guard (Enforces min 4.5s threshold between fetch triggers)
       │
       ▼
3. Server-Side In-Memory Cache (10-second TTL keyed by bounding box)
       │
       ▼
4. OpenSky Network API (HTTP Basic Auth with secure server credentials)
```

1. **Server In-Memory Cache**:
   - Location: `src/app/api/flights/route.ts`
   - Cache Key: Bounding box coordinates `${lamin},${lomin},${lamax},${lomax}`
   - TTL: 10,000 ms (10 seconds)
   - Behavior: If multiple browser windows, tabs, or components request flight data for the same airspace sector within 10 seconds, the response is served instantly from server memory without making an upstream network call.
   - Header Output: `X-Data-Source: cache`, `X-Cache-Expires-In: <seconds>`.

2. **Page Visibility Conservation**:
   - Location: `src/hooks/useFlightPolling.ts`
   - Utilizing `document.visibilityState`: If a user navigates to another browser tab or minimizes the browser, the polling timer halts completely. This prevents draining the user's daily API quota while unattended.
   - On re-focus, if the data is older than 12 seconds, an immediate refresh is performed.

3. **Manual Refresh Debouncing**:
   - The manual refresh button is locked with a minimum 4.5s debounce guard to prevent users from rapidly clicking refresh and exhausting quotas.

---

## 2. Stale Data Handling & Differential Tracking

### 2.1 The Problem
In air traffic surveillance:
- Aircraft fly in and out of receiver coverage or terrain shadows.
- Transponders experience packet drops (MLAT/ADS-B jitter).
- Removing an aircraft immediately upon a single missed poll produces jarring flickering and destroys flight path continuity.

### 2.2 Differential State Machine
The Zustand airspace store (`src/store/useAirspaceStore.ts`) maintains an internal registry with state flags:

```
[ New Aircraft Detected ] ──> isNewArrival: true (highlighted on radar for 10s)
            │
            ▼
   [ Nominal Active ]  ──> Reported in latest poll (latency < 15s)
            │
      Missed 1 poll
            ▼
    [ Stale Aircraft ]  ──> isStale: true (opacity reduced to 45%, dead reckoning continues)
            │
      Age > 120s
            ▼
   [ Pruned from Store ] ──> Removed from memory and map layers
```

- **Grace Period (120 seconds)**:
  If an aircraft was present in poll $N$ but missing in poll $N+1$, it is marked `isStale: true` but retained in the map layer and roster.
- **Dead Reckoning Horizon (60 seconds)**:
  For stale aircraft with valid velocity and heading, dead reckoning will extrapolate its expected position for up to 60 seconds. Beyond 60 seconds, extrapolation stops to prevent ghost aircraft from drifting away indefinitely.
- **Pruning**:
  Only after an aircraft has failed to report for more than 120 seconds is it cleanly evicted from the client state.

---

## 3. Upstream API Failure Recovery

### 3.1 HTTP 429 (Too Many Requests)
When OpenSky returns status code `429`:
1. The server proxy catches the error without returning a 500 error to the frontend.
2. If a previously cached response exists (even if past its 10-second TTL), it is served immediately with `X-Data-Source: fallback` and `rateLimitRemaining: 0`.
3. If no previous cache is present, the proxy loads a realistic pre-recorded regional snapshot from `src/lib/mockData.ts`.
4. The frontend detects `rate_limited` status and displays the high-visibility **Simulation / Rate-Limit Recovery Banner** with an automated 10-second cooldown recovery counter.

### 3.2 HTTP 500 / 502 / 503 / 504 (Server Outages)
OpenSky servers undergo scheduled maintenance and occasional outages.
- The route handler catches non-200 HTTP statuses and network exceptions.
- It returns an operational fallback payload with error diagnostic metadata (`meta.errorMessage`).
- The application remains 100% interactive, allowing the operator to inspect mock flight paths, run dead-reckoning simulations, and test emergency alerts.

### 3.3 Handling Incomplete or Null Data Fields
OpenSky state vectors frequently contain `null` values for attributes depending on whether the reporting sensor is ADS-B, Mode-S, or MLAT:

| Field | Possible Value | Normalization Strategy in `normalizeStateVector` |
| :--- | :--- | :--- |
| `callsign` | `null` or whitespace | Strip whitespace; fallback to `"ICAO-" + icao24.toUpperCase()` |
| `baro_altitude` | `null` | Fallback to `geo_altitude`; converted from meters to feet |
| `velocity` | `null` | Displayed as `"---"`; dead-reckoning is disabled for this target |
| `true_track` | `null` | Displayed as `"---"`; icon defaults to neutral upright orientation |
| `squawk` | `null` | Displayed as `"NONE"`; exempt from emergency alert checks |

---

## 4. Performance Optimizations for High Fleet Volumes

1. **Selective DOM / Marker Updates**:
   - `AircraftMarkerLayer.tsx` maintains an internal `Map<string, L.Marker>` of active Leaflet markers.
   - On each store update, markers are updated in-place via `.setLatLng()` and `.setIcon()` rather than tearing down and reconstructing the entire Leaflet layer.
2. **React StrictMode & Leaflet Compatibility**:
   - `next.config.mjs` sets `reactStrictMode: false` to prevent Leaflet map double-mounting bugs in development.
3. **Dynamic Import with SSR Disabled**:
   - `ATCMapContainer.tsx` wraps the Leaflet canvas in `next/dynamic(..., { ssr: false })` to eliminate server-side window evaluation errors.
