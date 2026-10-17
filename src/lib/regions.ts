import { AirspaceRegion } from "@/types/flight";

export const AIRSPACE_REGIONS: AirspaceRegion[] = [
  {
    id: "europe",
    name: "Western Europe",
    flag: "🇪🇺",
    bbox: {
      lamin: 45.0,
      lomin: -4.0,
      lamax: 55.0,
      lomax: 15.0,
    },
    center: [50.1109, 8.6821], // Frankfurt area
    zoom: 6,
    description: "High-density European corridor (London, Paris, Frankfurt, Amsterdam)",
  },
  {
    id: "us_east",
    name: "US East Coast",
    flag: "🇺🇸",
    bbox: {
      lamin: 35.0,
      lomin: -85.0,
      lamax: 45.0,
      lomax: -70.0,
    },
    center: [40.7128, -74.006], // New York / Tri-state area
    zoom: 6,
    description: "Eastern US corridor (JFK, EWR, LGA, DCA, ATL, BOS)",
  },
  {
    id: "us_west",
    name: "US West Coast",
    flag: "🇺🇸",
    bbox: {
      lamin: 32.0,
      lomin: -125.0,
      lamax: 49.0,
      lomax: -115.0,
    },
    center: [37.7749, -122.4194], // San Francisco / LA
    zoom: 6,
    description: "Pacific coast corridor (LAX, SFO, SEA, SAN)",
  },
  {
    id: "india",
    name: "India & South Asia",
    flag: "🇮🇳",
    bbox: {
      lamin: 8.0,
      lomin: 68.0,
      lamax: 32.0,
      lomax: 90.0,
    },
    center: [20.5937, 78.9629], // Central India
    zoom: 5,
    description: "Indian subcontinent airspace (DEL, BOM, BLR, MAA, HYD)",
  },
  {
    id: "east_asia",
    name: "East Asia",
    flag: "🇯🇵",
    bbox: {
      lamin: 25.0,
      lomin: 120.0,
      lamax: 42.0,
      lomax: 142.0,
    },
    center: [35.6762, 139.6503], // Tokyo
    zoom: 6,
    description: "Tokyo, Seoul, Taipei & Eastern coastal routes",
  },
  {
    id: "middle_east",
    name: "Middle East Hubs",
    flag: "🇦🇪",
    bbox: {
      lamin: 20.0,
      lomin: 45.0,
      lamax: 32.0,
      lomax: 60.0,
    },
    center: [25.2048, 55.2708], // Dubai / Gulf
    zoom: 6,
    description: "Major Gulf intercontinental transit hubs (DXB, DOH, AUH)",
  },
];

export const DEFAULT_REGION = AIRSPACE_REGIONS[0]; // Western Europe

export function getRegionById(id: string): AirspaceRegion {
  return AIRSPACE_REGIONS.find((r) => r.id === id) || DEFAULT_REGION;
}
