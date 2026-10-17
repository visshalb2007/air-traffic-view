/**
 * Raw state vector representation from OpenSky Network REST API
 * @see https://openskynetwork.github.io/opensky-api/rest.html
 */
export type OpenSkyRawStateVector = [
  string, // 0: icao24
  string | null, // 1: callsign
  string, // 2: origin_country
  number | null, // 3: time_position
  number, // 4: last_contact
  number | null, // 5: longitude
  number | null, // 6: latitude
  number | null, // 7: baro_altitude
  boolean, // 8: on_ground
  number | null, // 9: velocity
  number | null, // 10: true_track
  number | null, // 11: vertical_rate
  number[] | null, // 12: sensors
  number | null, // 13: geo_altitude
  string | null, // 14: squawk
  boolean, // 15: spi
  number // 16: position_source (0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM)
];

export interface OpenSkyApiResponse {
  time: number;
  states: OpenSkyRawStateVector[] | null;
}

export interface FlightHistoryPoint {
  lat: number;
  lon: number;
  altitudeMeters: number | null;
  altitudeFeet: number | null;
  velocityKnots: number | null;
  heading: number | null;
  timestamp: number;
}

export interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null; // meters
  baroAltitudeFt: number | null; // feet
  geoAltitude: number | null; // meters
  geoAltitudeFt: number | null; // feet
  onGround: boolean;
  velocity: number | null; // m/s
  velocityKts: number | null; // knots
  velocityKmh: number | null; // km/h
  trueTrack: number | null; // degrees (0-360)
  verticalRate: number | null; // m/s
  verticalRateFpm: number | null; // ft/min
  squawk: string | null;
  spi: boolean;
  positionSource: number;
  // Dynamic client tracking attributes
  lastSeenAt: number;
  isStale: boolean;
  isDeadReckoned?: boolean;
  deadReckonedLat?: number;
  deadReckonedLon?: number;
  history: FlightHistoryPoint[];
  firstSeenAt: number;
  isNewArrival?: boolean;
}

export interface BoundingBox {
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
}

export interface AirspaceRegion {
  id: string;
  name: string;
  flag: string;
  bbox: BoundingBox;
  center: [number, number];
  zoom: number;
  description: string;
}

export interface FlightFilterState {
  searchQuery: string;
  minAltitudeFt: number;
  maxAltitudeFt: number;
  minSpeedKts: number;
  maxSpeedKts: number;
  status: "all" | "airborne" | "ground";
  emergencyOnly: boolean;
  originCountry: string;
}

export type ConnectionState = "live" | "cached" | "stale" | "rate_limited" | "fallback" | "error";

export interface ApiStatusMeta {
  source: "live" | "cache" | "fallback";
  timestamp: number;
  cachedAt?: number;
  expiresInSeconds?: number;
  rateLimitRemaining?: number;
  totalTracked: number;
  responseTimeMs: number;
  errorMessage?: string;
}

export interface FlightApiResponse {
  success: boolean;
  time: number;
  meta: ApiStatusMeta;
  aircraft: Aircraft[];
}

export type AlertSeverity = "info" | "warning" | "emergency";

export interface AlertEvent {
  id: string;
  icao24: string;
  callsign: string;
  type: "squawk_7700" | "squawk_7600" | "squawk_7500" | "low_altitude" | "rapid_descent" | "speed_anomaly";
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  isDismissed: boolean;
}
