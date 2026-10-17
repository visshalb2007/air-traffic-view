import { NextRequest, NextResponse } from "next/server";
import { getRegionById, DEFAULT_REGION } from "@/lib/regions";
import { getRecordedAirspace, normalizeStateVector } from "@/lib/mockData";
import { Aircraft, FlightApiResponse, OpenSkyApiResponse } from "@/types/flight";

export const dynamic = "force-dynamic";

interface CacheEntry {
  timestamp: number;
  expiresAt: number;
  data: Aircraft[];
  rawCount: number;
}

// In-memory server-side cache keyed by bounding box query string
const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 1000; // 10 seconds TTL
let lastRateLimitReset = 0;

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

  // If bounding box not provided, use region default
  if (isNaN(lamin) || isNaN(lomin) || isNaN(lamax) || isNaN(lomax)) {
    const region = getRegionById(regionId);
    lamin = region.bbox.lamin;
    lomin = region.bbox.lomin;
    lamax = region.bbox.lamax;
    lomax = region.bbox.lomax;
  }

  const cacheKey = `${lamin.toFixed(2)},${lomin.toFixed(2)},${lamax.toFixed(2)},${lomax.toFixed(2)}`;

  // 1. Check if user explicitly requested offline / simulation mode
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

  // 2. Check in-memory cache
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

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

  // 3. Prepare OpenSky Network API Request
  const baseUrl = process.env.OPENSKY_BASE_URL || "https://opensky-network.org/api";
  const openSkyUrl = `${baseUrl}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "SkyWatch-ATC-Monitoring-App/1.0",
  };

  // Attach Basic Auth if credentials are configured in environment
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (clientId && clientSecret) {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    headers["Authorization"] = `Basic ${authString}`;
  }

  try {
    const apiRes = await fetch(openSkyUrl, {
      headers,
      next: { revalidate: 10 },
    });

    // 4. Handle Rate Limiting (429) gracefully
    if (apiRes.status === 429) {
      console.warn(`[OpenSky Proxy] 429 Rate Limited. Serving cached or fallback data.`);
      lastRateLimitReset = Date.now() + 10000;

      // If we have any existing cache (even expired), serve it
      const fallbackAircraft = cached ? cached.data : getRecordedAirspace(regionId);
      const response: FlightApiResponse = {
        success: true,
        time: Math.floor(Date.now() / 1000),
        meta: {
          source: cached ? "cache" : "fallback",
          timestamp: Date.now(),
          totalTracked: fallbackAircraft.length,
          responseTimeMs: Date.now() - startTime,
          rateLimitRemaining: 0,
          errorMessage: "OpenSky rate limit reached (HTTP 429). Serving cached/fallback snapshot.",
        },
        aircraft: fallbackAircraft,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          "X-Data-Source": "fallback",
          "X-RateLimit-Exceeded": "true",
          "X-Total-Aircraft": String(fallbackAircraft.length),
        },
      });
    }

    // 5. Handle upstream server errors (500, 502, 503)
    if (!apiRes.ok) {
      console.error(`[OpenSky Proxy] Upstream API error: ${apiRes.status} ${apiRes.statusText}`);
      const fallbackAircraft = cached ? cached.data : getRecordedAirspace(regionId);
      const response: FlightApiResponse = {
        success: true,
        time: Math.floor(Date.now() / 1000),
        meta: {
          source: "fallback",
          timestamp: Date.now(),
          totalTracked: fallbackAircraft.length,
          responseTimeMs: Date.now() - startTime,
          errorMessage: `OpenSky server error (${apiRes.status}). Resilient fallback activated.`,
        },
        aircraft: fallbackAircraft,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: { "X-Data-Source": "fallback" },
      });
    }

    // 6. Parse and normalize live states
    const rawData = (await apiRes.json()) as OpenSkyApiResponse;
    const states = rawData.states || [];

    const normalizedAircraft: Aircraft[] = states
      .filter((v) => v[5] !== null && v[6] !== null) // valid coords
      .map((v) => normalizeStateVector(v, now));

    // Update in-memory cache
    memoryCache.set(cacheKey, {
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
      data: normalizedAircraft,
      rawCount: states.length,
    });

    const response: FlightApiResponse = {
      success: true,
      time: rawData.time || Math.floor(now / 1000),
      meta: {
        source: "live",
        timestamp: now,
        expiresInSeconds: 10,
        totalTracked: normalizedAircraft.length,
        responseTimeMs: Date.now() - startTime,
      },
      aircraft: normalizedAircraft,
    };

    return NextResponse.json(response, {
      headers: {
        "X-Data-Source": "live",
        "X-Cache-Expires-In": "10",
        "X-Total-Aircraft": String(normalizedAircraft.length),
      },
    });
  } catch (error: any) {
    console.error(`[OpenSky Proxy] Network exception:`, error.message);
    const fallbackAircraft = cached ? cached.data : getRecordedAirspace(regionId);

    const response: FlightApiResponse = {
      success: true,
      time: Math.floor(Date.now() / 1000),
      meta: {
        source: "fallback",
        timestamp: Date.now(),
        totalTracked: fallbackAircraft.length,
        responseTimeMs: Date.now() - startTime,
        errorMessage: `Network error reaching OpenSky. Serving offline fallback dataset.`,
      },
      aircraft: fallbackAircraft,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { "X-Data-Source": "fallback" },
    });
  }
}
