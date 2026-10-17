import { Aircraft, OpenSkyRawStateVector } from "@/types/flight";

export const METERS_TO_FEET = 3.28084;
export const MS_TO_KNOTS = 1.94384;
export const MS_TO_KMH = 3.6;
export const MS_TO_FPM = 196.85;

/**
 * Normalizes a raw OpenSky state vector array into a typed Aircraft object
 */
export function normalizeStateVector(vector: OpenSkyRawStateVector, currentTime = Date.now()): Aircraft {
  const [
    icao24,
    rawCallsign,
    originCountry,
    timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude,
    onGround,
    velocity,
    trueTrack,
    verticalRate,
    sensors,
    geoAltitude,
    squawk,
    spi,
    positionSource,
  ] = vector;

  const cleanCallsign = rawCallsign ? rawCallsign.trim() : `ICAO-${icao24.toUpperCase()}`;
  const baroAltM = baroAltitude ?? geoAltitude ?? null;
  const baroAltFt = baroAltM !== null ? Math.round(baroAltM * METERS_TO_FEET) : null;
  const geoAltM = geoAltitude ?? baroAltitude ?? null;
  const geoAltFt = geoAltM !== null ? Math.round(geoAltM * METERS_TO_FEET) : null;

  const velKts = velocity !== null ? Math.round(velocity * MS_TO_KNOTS) : null;
  const velKmh = velocity !== null ? Math.round(velocity * MS_TO_KMH) : null;
  const vertFpm = verticalRate !== null ? Math.round(verticalRate * MS_TO_FPM) : null;

  return {
    icao24: icao24.toLowerCase(),
    callsign: cleanCallsign || `N/A`,
    originCountry: originCountry || "Unknown",
    timePosition,
    lastContact,
    longitude,
    latitude,
    baroAltitude: baroAltM,
    baroAltitudeFt: baroAltFt,
    geoAltitude: geoAltM,
    geoAltitudeFt: geoAltFt,
    onGround: !!onGround,
    velocity,
    velocityKts: velKts,
    velocityKmh: velKmh,
    trueTrack: trueTrack !== null ? Math.round(trueTrack * 10) / 10 : null,
    verticalRate,
    verticalRateFpm: vertFpm,
    squawk: squawk ? squawk.trim() : null,
    spi: !!spi,
    positionSource: positionSource ?? 0,
    lastSeenAt: currentTime,
    isStale: false,
    history:
      latitude !== null && longitude !== null
        ? [
            {
              lat: latitude,
              lon: longitude,
              altitudeMeters: baroAltM,
              altitudeFeet: baroAltFt,
              velocityKnots: velKts,
              heading: trueTrack,
              timestamp: timePosition ? timePosition * 1000 : currentTime,
            },
          ]
        : [],
    firstSeenAt: currentTime,
  };
}

/**
 * Realistic pre-recorded regional snapshots for offline simulation and fallback
 */
export const RECORDED_REGIONAL_SNAPSHOTS: Record<string, OpenSkyRawStateVector[]> = {
  europe: [
    ["406f52", "BAW456  ", "United Kingdom", 1792224000, 1792224000, 0.12, 51.5, 9450, false, 215, 85, 0, null, 9600, "1000", false, 0],
    ["3c6444", "DLH112  ", "Germany", 1792224000, 1792224000, 8.54, 50.03, 10600, false, 240, 135, -2.5, null, 10800, "2000", false, 0],
    ["3949f2", "AFR320  ", "France", 1792224000, 1792224000, 2.55, 49.0, 7500, false, 185, 210, 5.0, null, 7700, "1000", false, 0],
    ["4841b8", "KLM198  ", "Netherlands", 1792224000, 1792224000, 4.76, 52.3, 11000, false, 230, 290, 0, null, 11200, "1000", false, 0],
    ["4ca9ee", "RYR782  ", "Ireland", 1792224000, 1792224000, -1.8, 52.45, 11500, false, 220, 160, 0, null, 11700, "4521", false, 0],
    ["345241", "IBE314  ", "Spain", 1792224000, 1792224000, 2.1, 48.5, 10300, false, 235, 195, 0, null, 10500, "1000", false, 0],
    ["4b1805", "SWR814  ", "Switzerland", 1792224000, 1792224000, 8.55, 47.45, 8200, false, 190, 45, -3.2, null, 8400, "1000", false, 0],
    ["407722", "EZY882  ", "United Kingdom", 1792224000, 1792224000, -0.18, 51.15, 6800, false, 170, 70, 3.5, null, 7000, "1000", false, 0],
    ["300185", "ITY440  ", "Italy", 1792224000, 1792224000, 9.27, 45.63, 10900, false, 245, 315, 0, null, 11100, "1000", false, 0],
    ["461f88", "FIN618  ", "Finland", 1792224000, 1792224000, 10.2, 53.5, 11200, false, 250, 40, 0, null, 11400, "1000", false, 0],
    ["440522", "AUA501  ", "Austria", 1792224000, 1792224000, 11.5, 48.2, 8900, false, 205, 110, -4.0, null, 9100, "1000", false, 0],
    ["3c4b22", "CFG382  ", "Germany", 1792224000, 1792224000, 7.8, 51.1, 9800, false, 225, 230, 0, null, 10000, "1000", false, 0],
    // Realistic simulated Emergency flight for alerting verification:
    ["39de46", "EMRG77  ", "France", 1792224000, 1792224000, 4.2, 49.8, 3200, false, 160, 240, -12.5, null, 3300, "7700", true, 0],
  ],
  us_east: [
    ["a12b45", "AAL100  ", "United States", 1792224000, 1792224000, -73.78, 40.64, 9100, false, 220, 80, 2.5, null, 9300, "1000", false, 0],
    ["a45f91", "DAL452  ", "United States", 1792224000, 1792224000, -84.42, 33.64, 8500, false, 210, 340, 0, null, 8700, "2451", false, 0],
    ["a88cc1", "UAL881  ", "United States", 1792224000, 1792224000, -74.17, 40.69, 10500, false, 240, 275, 0, null, 10700, "1000", false, 0],
    ["aa1408", "JBU523  ", "United States", 1792224000, 1792224000, -71.01, 42.36, 7200, false, 180, 195, -3.0, null, 7400, "1000", false, 0],
    ["a90123", "SWA191  ", "United States", 1792224000, 1792224000, -77.04, 38.85, 6500, false, 175, 15, 0, null, 6700, "1000", false, 0],
    ["ab3301", "EDV501  ", "United States", 1792224000, 1792224000, -75.24, 39.87, 8200, false, 195, 230, 0, null, 8400, "1000", false, 0],
  ],
  india: [
    ["8005cd", "AIC101  ", "India", 1792224000, 1792224000, 72.87, 19.09, 8800, false, 210, 320, 0, null, 9000, "1000", false, 0],
    ["800a42", "IGO442  ", "India", 1792224000, 1792224000, 77.10, 28.55, 9600, false, 225, 140, -2.5, null, 9800, "1000", false, 0],
    ["801123", "SEJ812  ", "India", 1792224000, 1792224000, 77.70, 13.19, 7900, false, 190, 85, 3.0, null, 8100, "1000", false, 0],
    ["800fe1", "VTI928  ", "India", 1792224000, 1792224000, 80.17, 12.99, 10200, false, 235, 210, 0, null, 10400, "1000", false, 0],
    ["800911", "AXB172  ", "India", 1792224000, 1792224000, 78.43, 17.24, 8400, false, 200, 350, 0, null, 8600, "1000", false, 0],
  ],
  middle_east: [
    ["896452", "UAE001  ", "United Arab Emirates", 1792224000, 1792224000, 55.36, 25.25, 11200, false, 250, 305, 0, null, 11400, "1000", false, 0],
    ["06a12b", "QTR115  ", "Qatar", 1792224000, 1792224000, 51.56, 25.27, 10800, false, 240, 290, 0, null, 11000, "1000", false, 0],
    ["896112", "ETD19   ", "United Arab Emirates", 1792224000, 1792224000, 54.65, 24.43, 9900, false, 230, 120, -3.0, null, 10100, "1000", false, 0],
  ],
  us_west: [
    ["a09812", "ASA402  ", "United States", 1792224000, 1792224000, -122.37, 37.62, 8500, false, 210, 310, 0, null, 8700, "1000", false, 0],
    ["a44819", "UAL210  ", "United States", 1792224000, 1792224000, -118.40, 33.94, 9200, false, 220, 250, 2.0, null, 9400, "1000", false, 0],
    ["a71234", "SWA890  ", "United States", 1792224000, 1792224000, -122.31, 47.45, 7800, false, 190, 170, 0, null, 8000, "1000", false, 0],
  ],
  east_asia: [
    ["867123", "ANA108  ", "Japan", 1792224000, 1792224000, 139.78, 35.55, 9400, false, 225, 60, 0, null, 9600, "1000", false, 0],
    ["869401", "JAL512  ", "Japan", 1792224000, 1792224000, 140.38, 35.76, 10500, false, 240, 220, -3.0, null, 10700, "1000", false, 0],
    ["71c110", "KAL701  ", "Republic of Korea", 1792224000, 1792224000, 126.44, 37.46, 8800, false, 215, 150, 0, null, 9000, "1000", false, 0],
  ],
};

/**
 * Returns normalized aircraft list for a region from pre-recorded snapshots
 */
export function getRecordedAirspace(regionId = "europe"): Aircraft[] {
  const vectors = RECORDED_REGIONAL_SNAPSHOTS[regionId] || RECORDED_REGIONAL_SNAPSHOTS.europe;
  const now = Date.now();
  return vectors.map((v) => normalizeStateVector(v, now));
}
