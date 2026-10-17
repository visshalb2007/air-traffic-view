import { Aircraft, FlightHistoryPoint } from "@/types/flight";

const EARTH_RADIUS_METERS = 6371000;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculates a new latitude and longitude given a starting point,
 * speed in m/s, true track heading in degrees, and elapsed seconds.
 */
export function extrapolatePosition(
  lat: number,
  lon: number,
  speedMs: number,
  headingDeg: number,
  elapsedSeconds: number
): { lat: number; lon: number } {
  if (speedMs <= 0 || elapsedSeconds <= 0) {
    return { lat, lon };
  }

  // Distance in meters
  const distance = speedMs * elapsedSeconds;
  const angularDistance = distance / EARTH_RADIUS_METERS;
  const headingRad = headingDeg * DEG_TO_RAD;

  const lat1 = lat * DEG_TO_RAD;
  const lon1 = lon * DEG_TO_RAD;

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAngularDist = Math.sin(angularDistance);
  const cosAngularDist = Math.cos(angularDistance);

  const lat2 = Math.asin(
    sinLat1 * cosAngularDist + cosLat1 * sinAngularDist * Math.cos(headingRad)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(headingRad) * sinAngularDist * cosLat1,
      cosAngularDist - sinLat1 * Math.sin(lat2)
    );

  // Normalize lon to -180..+180
  const normalizedLon = ((lon2 * RAD_TO_DEG + 540) % 360) - 180;

  return {
    lat: lat2 * RAD_TO_DEG,
    lon: normalizedLon,
  };
}

/**
 * Extrapolates current aircraft position using dead reckoning.
 * Automatically caps extrapolation to maximum 60 seconds for safety.
 */
export function computeDeadReckonedAircraft(
  aircraft: Aircraft,
  currentTimeMs = Date.now()
): Aircraft {
  // If on ground or no valid velocity/heading, keep original
  if (
    aircraft.onGround ||
    aircraft.velocity === null ||
    aircraft.trueTrack === null ||
    aircraft.latitude === null ||
    aircraft.longitude === null
  ) {
    return {
      ...aircraft,
      isDeadReckoned: false,
    };
  }

  // Calculate elapsed seconds since last reported telemetry
  const referenceTimeMs = aircraft.timePosition
    ? aircraft.timePosition * 1000
    : aircraft.lastContact * 1000 || aircraft.lastSeenAt;

  const elapsedSeconds = Math.max(0, (currentTimeMs - referenceTimeMs) / 1000);

  // Don't dead reckon beyond 60 seconds (marked as stale instead)
  if (elapsedSeconds <= 0.5 || elapsedSeconds > 60) {
    return {
      ...aircraft,
      isDeadReckoned: false,
      isStale: elapsedSeconds > 60,
    };
  }

  const { lat, lon } = extrapolatePosition(
    aircraft.latitude,
    aircraft.longitude,
    aircraft.velocity,
    aircraft.trueTrack,
    elapsedSeconds
  );

  // Extrapolate altitude if vertical rate is reported
  let extrapolatedAltM = aircraft.baroAltitude;
  let extrapolatedAltFt = aircraft.baroAltitudeFt;
  if (aircraft.verticalRate !== null && aircraft.baroAltitude !== null) {
    extrapolatedAltM = Math.max(
      0,
      Math.round(aircraft.baroAltitude + aircraft.verticalRate * elapsedSeconds)
    );
    extrapolatedAltFt = Math.round(extrapolatedAltM * 3.28084);
  }

  return {
    ...aircraft,
    deadReckonedLat: lat,
    deadReckonedLon: lon,
    baroAltitude: extrapolatedAltM,
    baroAltitudeFt: extrapolatedAltFt,
    isDeadReckoned: true,
    isStale: elapsedSeconds > 30,
  };
}

/**
 * Calculates great circle distance between two lat/lon coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (EARTH_RADIUS_METERS * c) / 1000;
}
