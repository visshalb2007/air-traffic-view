import { create } from "zustand";
import {
  Aircraft,
  AirspaceRegion,
  AlertEvent,
  ApiStatusMeta,
  ConnectionState,
  FlightFilterState,
  FlightHistoryPoint,
} from "@/types/flight";
import { DEFAULT_REGION, getRegionById } from "@/lib/regions";
import { computeDeadReckonedAircraft } from "@/lib/deadReckoning";

interface AirspaceStoreState {
  // Core Aircraft State
  aircraftMap: Record<string, Aircraft>;
  selectedIcao24: string | null;
  highlightedIcao24: string | null;

  // Region & View
  currentRegion: AirspaceRegion;
  customBbox: { lamin: number; lomin: number; lamax: number; lomax: number } | null;

  // Metadata & Connection
  connectionState: ConnectionState;
  apiMeta: ApiStatusMeta | null;
  lastUpdatedTime: number | null;
  isPolling: boolean;
  pollCountdown: number;

  // Features & Toggles
  isOfflineMode: boolean;
  deadReckoningEnabled: boolean;
  showTrails: boolean;
  maxHistoryPoints: number;

  // Filters
  filters: FlightFilterState;

  // Alerts
  alerts: AlertEvent[];
  unreadAlertCount: number;

  // Basemap & Units
  basemap: "dark" | "satellite" | "osm";
  unitSystem: "aviation" | "metric";
  isFollowingSelected: boolean;
  flyToTarget: [number, number] | null;

  // Actions
  setBasemap: (basemap: "dark" | "satellite" | "osm") => void;
  setUnitSystem: (unit: "aviation" | "metric") => void;
  setIsFollowingSelected: (follow: boolean) => void;
  triggerFlyTo: (coords: [number, number] | null) => void;
  setSelectedAircraft: (icao24: string | null) => void;
  setHighlightedAircraft: (icao24: string | null) => void;
  setRegion: (region: AirspaceRegion) => void;
  setCustomBbox: (bbox: { lamin: number; lomin: number; lamax: number; lomax: number } | null) => void;
  updateAircraftTelemetry: (incoming: Aircraft[], meta: ApiStatusMeta) => void;
  tickDeadReckoning: () => void;
  setConnectionState: (state: ConnectionState) => void;
  setIsPolling: (isPolling: boolean) => void;
  setPollCountdown: (seconds: number) => void;
  decrementCountdown: () => void;
  toggleOfflineMode: () => void;
  toggleDeadReckoning: () => void;
  toggleShowTrails: () => void;
  setFilters: (partial: Partial<FlightFilterState>) => void;
  resetFilters: () => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

const DEFAULT_FILTERS: FlightFilterState = {
  searchQuery: "",
  minAltitudeFt: 0,
  maxAltitudeFt: 50000,
  minSpeedKts: 0,
  maxSpeedKts: 800,
  status: "all",
  emergencyOnly: false,
  originCountry: "all",
};

export const useAirspaceStore = create<AirspaceStoreState>((set, get) => ({
  aircraftMap: {},
  selectedIcao24: null,
  highlightedIcao24: null,

  currentRegion: DEFAULT_REGION,
  customBbox: null,

  connectionState: "live",
  apiMeta: null,
  lastUpdatedTime: null,
  isPolling: true,
  pollCountdown: 10,

  isOfflineMode: false,
  deadReckoningEnabled: true,
  showTrails: true,
  maxHistoryPoints: 40,

  filters: DEFAULT_FILTERS,

  alerts: [],
  unreadAlertCount: 0,

  basemap: "dark",
  unitSystem: "aviation",
  isFollowingSelected: false,
  flyToTarget: null,

  setBasemap: (basemap) => set({ basemap }),
  setUnitSystem: (unitSystem) => set({ unitSystem }),
  setIsFollowingSelected: (isFollowingSelected) => set({ isFollowingSelected }),
  triggerFlyTo: (flyToTarget) => set({ flyToTarget }),

  setSelectedAircraft: (icao24) => {
    const state = get();
    set({ selectedIcao24: icao24 });
    if (icao24 && state.aircraftMap[icao24]) {
      const ac = state.aircraftMap[icao24];
      const lat = ac.deadReckonedLat ?? ac.latitude;
      const lon = ac.deadReckonedLon ?? ac.longitude;
      if (lat !== null && lon !== null) {
        set({ flyToTarget: [lat, lon] });
      }
    }
  },
  setHighlightedAircraft: (icao24) => set({ highlightedIcao24: icao24 }),

  setRegion: (region) => {
    set({
      currentRegion: region,
      customBbox: null,
      selectedIcao24: null,
    });
  },

  setCustomBbox: (bbox) => set({ customBbox: bbox }),

  updateAircraftTelemetry: (incoming, meta) => {
    const state = get();
    const existingMap = state.aircraftMap;
    const now = Date.now();
    const updatedMap: Record<string, Aircraft> = {};
    const seenIcaos = new Set<string>();
    const newAlerts: AlertEvent[] = [];

    // 1. Process incoming aircraft
    for (const incomingAc of incoming) {
      const icao = incomingAc.icao24;
      seenIcaos.add(icao);
      const existing = existingMap[icao];

      // Maintain history breadcrumbs
      const previousHistory: FlightHistoryPoint[] = existing?.history || [];
      const newPoint: FlightHistoryPoint | null =
        incomingAc.latitude !== null && incomingAc.longitude !== null
          ? {
              lat: incomingAc.latitude,
              lon: incomingAc.longitude,
              altitudeMeters: incomingAc.baroAltitude,
              altitudeFeet: incomingAc.baroAltitudeFt,
              velocityKnots: incomingAc.velocityKts,
              heading: incomingAc.trueTrack,
              timestamp: incomingAc.timePosition ? incomingAc.timePosition * 1000 : now,
            }
          : null;

      // Only add point if it moved or has new timestamp
      let updatedHistory = previousHistory;
      if (newPoint) {
        const lastPt = previousHistory[previousHistory.length - 1];
        if (!lastPt || lastPt.lat !== newPoint.lat || lastPt.lon !== newPoint.lon) {
          updatedHistory = [...previousHistory.slice(-state.maxHistoryPoints), newPoint];
        }
      }

      const isNewArrival = !existing;

      updatedMap[icao] = {
        ...incomingAc,
        history: updatedHistory,
        firstSeenAt: existing?.firstSeenAt || now,
        lastSeenAt: now,
        isStale: false,
        isNewArrival,
      };

      // 2. Check for alerts on this aircraft
      // Squawk emergencies
      if (incomingAc.squawk === "7700") {
        newAlerts.push({
          id: `${icao}-7700-${now}`,
          icao24: icao,
          callsign: incomingAc.callsign,
          type: "squawk_7700",
          severity: "emergency",
          title: "SQUAWK 7700: GENERAL EMERGENCY",
          message: `Aircraft ${incomingAc.callsign} declared general emergency transponder squawk 7700.`,
          timestamp: now,
          isDismissed: false,
        });
      } else if (incomingAc.squawk === "7600") {
        newAlerts.push({
          id: `${icao}-7600-${now}`,
          icao24: icao,
          callsign: incomingAc.callsign,
          type: "squawk_7600",
          severity: "warning",
          title: "SQUAWK 7600: RADIO FAILURE",
          message: `Aircraft ${incomingAc.callsign} lost radio communications (squawk 7600).`,
          timestamp: now,
          isDismissed: false,
        });
      } else if (incomingAc.squawk === "7500") {
        newAlerts.push({
          id: `${icao}-7500-${now}`,
          icao24: icao,
          callsign: incomingAc.callsign,
          type: "squawk_7500",
          severity: "emergency",
          title: "SQUAWK 7500: UNLAWFUL INTERFERENCE",
          message: `Aircraft ${incomingAc.callsign} squawking hijack / unlawful interference 7500!`,
          timestamp: now,
          isDismissed: false,
        });
      }

      // Low altitude alert (airborne, fast, below 2,000 ft)
      if (
        !incomingAc.onGround &&
        incomingAc.baroAltitudeFt !== null &&
        incomingAc.baroAltitudeFt > 0 &&
        incomingAc.baroAltitudeFt < 2000 &&
        incomingAc.velocityKts !== null &&
        incomingAc.velocityKts > 220
      ) {
        newAlerts.push({
          id: `${icao}-lowalt-${now}`,
          icao24: icao,
          callsign: incomingAc.callsign,
          type: "low_altitude",
          severity: "warning",
          title: "LOW ALTITUDE WARNING",
          message: `${incomingAc.callsign} airborne at ${incomingAc.baroAltitudeFt} ft at ${incomingAc.velocityKts} kts.`,
          timestamp: now,
          isDismissed: false,
        });
      }

      // Rapid descent alert
      if (
        incomingAc.verticalRateFpm !== null &&
        incomingAc.verticalRateFpm < -3500 &&
        !incomingAc.onGround
      ) {
        newAlerts.push({
          id: `${icao}-descent-${now}`,
          icao24: icao,
          callsign: incomingAc.callsign,
          type: "rapid_descent",
          severity: "warning",
          title: "RAPID DESCENT DETECTED",
          message: `${incomingAc.callsign} descending at ${Math.abs(incomingAc.verticalRateFpm)} ft/min.`,
          timestamp: now,
          isDismissed: false,
        });
      }
    }

    // 3. Differential state retention:
    // Retain aircraft that weren't in this poll if they were seen in the last 120 seconds
    const STALE_THRESHOLD_MS = 30 * 1000;
    const PRUNE_THRESHOLD_MS = 120 * 1000;

    for (const [icao, oldAc] of Object.entries(existingMap)) {
      if (!seenIcaos.has(icao)) {
        const age = now - oldAc.lastSeenAt;
        if (age < PRUNE_THRESHOLD_MS) {
          updatedMap[icao] = {
            ...oldAc,
            isStale: age > STALE_THRESHOLD_MS,
            isNewArrival: false,
          };
        }
      }
    }

    // Determine connection state
    let nextConnectionState: ConnectionState = "live";
    if (meta.source === "fallback") {
      nextConnectionState = "fallback";
    } else if (meta.rateLimitRemaining === 0) {
      nextConnectionState = "rate_limited";
    } else if (meta.source === "cache") {
      nextConnectionState = "cached";
    }

    set((prev) => ({
      aircraftMap: updatedMap,
      apiMeta: meta,
      lastUpdatedTime: now,
      connectionState: nextConnectionState,
      alerts: [...newAlerts, ...prev.alerts].slice(0, 50),
      unreadAlertCount: prev.unreadAlertCount + newAlerts.length,
      pollCountdown: 10,
    }));
  },

  tickDeadReckoning: () => {
    const state = get();
    if (!state.deadReckoningEnabled) return;

    const now = Date.now();
    const currentMap = state.aircraftMap;
    const updatedMap: Record<string, Aircraft> = {};
    let hasChanges = false;

    for (const icao in currentMap) {
      const ac = currentMap[icao];
      if (ac.onGround || ac.velocity === null || ac.latitude === null || ac.longitude === null) {
        updatedMap[icao] = ac;
        continue;
      }

      updatedMap[icao] = computeDeadReckonedAircraft(ac, now);
      hasChanges = true;
    }

    if (hasChanges) {
      set({ aircraftMap: updatedMap });
    }
  },

  setConnectionState: (connectionState) => set({ connectionState }),
  setIsPolling: (isPolling) => set({ isPolling }),
  setPollCountdown: (pollCountdown) => set({ pollCountdown }),
  decrementCountdown: () =>
    set((state) => ({
      pollCountdown: Math.max(0, state.pollCountdown - 1),
    })),

  toggleOfflineMode: () =>
    set((state) => ({
      isOfflineMode: !state.isOfflineMode,
      selectedIcao24: null,
    })),

  toggleDeadReckoning: () =>
    set((state) => ({
      deadReckoningEnabled: !state.deadReckoningEnabled,
    })),

  toggleShowTrails: () =>
    set((state) => ({
      showTrails: !state.showTrails,
    })),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, isDismissed: true } : a)),
      unreadAlertCount: Math.max(0, state.unreadAlertCount - 1),
    })),

  clearAllAlerts: () =>
    set({
      alerts: [],
      unreadAlertCount: 0,
    }),
}));
