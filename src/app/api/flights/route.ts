import { NextRequest, NextResponse } from "next/server";
import { getRegionById } from "@/lib/regions";
import { getRecordedAirspace, normalizeStateVector } from "@/lib/mockData";
import { Aircraft, FlightApiResponse, OpenSkyApiResponse } from "@/types/flight";

export const dynamic = "force-dynamic";

interface CacheEntry {
  timestamp: number;
  expiresAt: number;
  data: Aircraft[];
  rawCount: number;
  isFetching?: boolean;
}

// In-memory server-side cache keyed by bounding box query string
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 1000; // 10 seconds TTL

async function fetchFromOpenSky(
  lamin: number,
  lomin: number,
  lamax: number,
  lomax: number,
  cacheKey: string
): Promise<Aircraft[] | null> {
  const baseUrl = process.env.OPENSKY_BASE_URL || "https://opensky-network.org/api";
  const openSkyUrl = `${baseUrl}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "SkyWatch-ATC-Monitoring-App/1.0",
  };

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (clientId && clientSecret) {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${authString}`;
  }

  try {
    const apiRes = await fetch(openSkyUrl, {
      headers,
      cache: "no-store",
    });

    if (!apiRes.ok) return null;

    const rawData = (await apiRes.json()) as OpenSkyApiResponse;
    const states = rawData.states || [];
    const now = Date.now();

    const normalizedAircraft: Aircraft[] = states
      .filter((v) => v[5] !== null && v[6] !== null)
      .map((v) => normalizeStateVector(v, now));

    memoryCache.set(cacheKey, {
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
      data: normalizedAircraft,
      rawCount: states.length,
      isFetching: false,
    });

    return normalizedAircraft;
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const searchParams = req.nextUrl.searchParams;

  const regionId = searchParams.get("region") || "europe";
  const forceOffline = searchParams.get("offline") === "true";

  // Bounding box params
  let lamin = parseFloat(searchParams.get("lamin") || "");
  let lomin = parseFloat(searchParams.get("lomin") || "");
  let lamax = parseFloat(searchParams.get("lamax") || "");
  let lomax = parseFloat(searchParams.get("lomax") || "");

  if (isNaN(lamin) || isNaN(lomin) || isNaN(lamax) || isNaN(lomax)) {
    const region = getRegionById(regionId);
    lamin = region.bbox.lamin;
    lomin = region.bbox.lomin;
    lamax = region.bbox.lamax;
    lomax = region.bbox.lomax;
  }

  const cacheKey = `${lamin.toFixed(2)},${lomin.toFixed(2)},${lamax.toFixed(2)},${lomax.toFixed(2)}`;

  // 1. Explicit offline mode
  if (forceOffline) {
    const fallbackAircraft = getRecordedAirspace(regionId);
    const response: FlightApiResponse = {
      success: true,
      time: Math.floor(Date.now() / 1000),
      meta: {
        source: "fallback",
        timestamp: Date.now(),
        totalTracked: fallbackAircraft.length,
        responseTimeMs: Date.now() - startTime,
        errorMessage: "Offline simulation mode active",
      },
      aircraft: fallbackAircraft,
    };
    return NextResponse.json(response, {
      headers: {
        "X-Data-Source": "fallback",
        "X-Total-Aircraft": String(fallbackAircraft.length),
      },
    });
  }

  // 2. Ultra-Fast Cache Hit Check (Sub-5ms response)
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  // If cache is fresh, return immediately (< 5ms)
  if (cached && now < cached.expiresAt) {
    const remainingSecs = Math.max(0, Math.round((cached.expiresAt - now) / 1000));
    const response: FlightApiResponse = {
      success: true,
      time: Math.floor(cached.timestamp / 1000),
      meta: {
        source: "cache",
        timestamp: cached.timestamp,
        cachedAt: cached.timestamp,
        expiresInSeconds: remainingSecs,
        totalTracked: cached.data.length,
        responseTimeMs: Date.now() - startTime,
      },
      aircraft: cached.data,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Data-Source": "cache",
        "X-Cache-Expires-In": String(remainingSecs),
        "X-Total-Aircraft": String(cached.data.length),
      },
    });
  }

  // 3. Stale-While-Revalidate: If we have an existing cache (even expired),
  // return it immediately in 2ms so the client UI never waits, while fetching fresh data in the background!
  if (cached && cached.data.length > 0) {
    if (!cached.isFetching) {
      cached.isFetching = true;
      fetchFromOpenSky(lamin, lomin, lamax, lomax, cacheKey);
    }

    const response: FlightApiResponse = {
      success: true,
      time: Math.floor(cached.timestamp / 1000),
      meta: {
        source: "cache",
        timestamp: cached.timestamp,
        totalTracked: cached.data.length,
        responseTimeMs: Date.now() - startTime,
        expiresInSeconds: 0,
      },
      aircraft: cached.data,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Data-Source": "cache",
        "X-Total-Aircraft": String(cached.data.length),
      },
    });
  }

  // 4. Initial Cold Start: Fetch live OpenSky data directly
  const liveAircraft = await fetchFromOpenSky(lamin, lomin, lamax, lomax, cacheKey);

  if (liveAircraft && liveAircraft.length > 0) {
    const response: FlightApiResponse = {
      success: true,
      time: Math.floor(Date.now() / 1000),
      meta: {
        source: "live",
        timestamp: Date.now(),
        expiresInSeconds: 10,
        totalTracked: liveAircraft.length,
        responseTimeMs: Date.now() - startTime,
      },
      aircraft: liveAircraft,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Data-Source": "live",
        "X-Total-Aircraft": String(liveAircraft.length),
      },
    });
  }

  // 5. Fallback if upstream error
  const fallbackAircraft = getRecordedAirspace(regionId);
  const response: FlightApiResponse = {
    success: true,
    time: Math.floor(Date.now() / 1000),
    meta: {
      source: "fallback",
      timestamp: Date.now(),
      totalTracked: fallbackAircraft.length,
      responseTimeMs: Date.now() - startTime,
      errorMessage: "Serving fallback airspace data",
    },
    aircraft: fallbackAircraft,
  };

  return NextResponse.json(response, {
    headers: {
      "X-Data-Source": "fallback",
      "X-Total-Aircraft": String(fallbackAircraft.length),
    },
  });
}
