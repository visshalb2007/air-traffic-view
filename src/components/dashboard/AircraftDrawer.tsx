"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Crosshair, X, Compass, ExternalLink } from "lucide-react";
import { FlightHistoryPoint } from "@/types/flight";

function getHeadingCompass(degrees: number | null): string {
  if (degrees === null) return "---";
  const sectors = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return sectors[index];
}

/**
 * Clean SVG Flight Profile Chart (Altitude Curve)
 */
function AltitudeProfileChart({
  history,
  currentAltFt,
}: {
  history: FlightHistoryPoint[];
  currentAltFt: number | null;
}) {
  const points = history.filter((p) => p.altitudeFeet !== null);

  if (points.length < 2) {
    return (
      <div className="h-14 w-full bg-[#0f1216] border border-[#262b33] rounded flex items-center justify-center text-[10px] text-[#8b929c]">
        Recording flight altitude profile...
      </div>
    );
  }

  const alts = points.map((p) => p.altitudeFeet as number);
  const minAlt = Math.min(...alts);
  const maxAlt = Math.max(...alts, 5000);
  const altSpan = Math.max(1000, maxAlt - minAlt);

  const w = 270;
  const h = 48;
  const padTop = 6;
  const padBottom = 8;
  const graphH = h - padTop - padBottom;

  const coords = points.map((p, i) => {
    const x = Math.round((i / (points.length - 1)) * w);
    const normalizedY = ((p.altitudeFeet! - minAlt) / altSpan);
    const y = Math.round(h - padBottom - normalizedY * graphH);
    return `${x},${y}`;
  });

  const linePath = `M ${coords.join(" L ")}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-[#8b929c]">
        <span>Altitude profile</span>
        <span className="font-mono tabular-nums">
          {minAlt.toLocaleString()} – {maxAlt.toLocaleString()} ft
        </span>
      </div>
      <div className="w-full bg-[#0f1216] border border-[#262b33] rounded p-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 overflow-visible">
          <defs>
            <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5a524" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f5a524" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Subtle baseline */}
          <line x1="0" y1={h - padBottom} x2={w} y2={h - padBottom} stroke="#262b33" strokeWidth="1" strokeDasharray="3 3" />
          {/* Area under curve */}
          <path d={areaPath} fill="url(#profileGradient)" />
          {/* Main altitude line */}
          <path d={linePath} fill="none" stroke="#f5a524" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Current position endpoint */}
          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].split(",")[0]}
              cy={coords[coords.length - 1].split(",")[1]}
              r="2.5"
              fill="#f5a524"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

export default function AircraftDrawer() {
  const {
    aircraftMap,
    selectedIcao24,
    setSelectedAircraft,
    isFollowingSelected,
    setIsFollowingSelected,
    unitSystem,
    setUnitSystem,
  } = useAirspaceStore();

  if (!selectedIcao24) return null;

  const aircraft = aircraftMap[selectedIcao24];
  if (!aircraft) return null;

  const lat = aircraft.deadReckonedLat ?? aircraft.latitude;
  const lon = aircraft.deadReckonedLon ?? aircraft.longitude;

  const isEmergency =
    aircraft.squawk === "7700" || aircraft.squawk === "7600" || aircraft.squawk === "7500";

  const secondsSinceReport = Math.max(
    0,
    Math.round(
      (Date.now() -
        (aircraft.timePosition
          ? aircraft.timePosition * 1000
          : aircraft.lastContact * 1000 || aircraft.lastSeenAt)) /
        1000
    )
  );

  const getVerticalRateText = () => {
    if (aircraft.onGround) return "On Ground";
    if (aircraft.verticalRateFpm === null || Math.abs(aircraft.verticalRateFpm) < 80) {
      return "0 ft/min (Level)";
    }
    const sign = aircraft.verticalRateFpm > 0 ? "+" : "";
    const direction = aircraft.verticalRateFpm > 0 ? "Climbing" : "Descending";
    return `${sign}${aircraft.verticalRateFpm.toLocaleString()} ft/min (${direction})`;
  };

  // Unit conversion helpers
  const altitudeText =
    unitSystem === "metric"
      ? aircraft.baroAltitude !== null
        ? `${aircraft.baroAltitude.toLocaleString()} m`
        : "---"
      : aircraft.baroAltitudeFt !== null
      ? `${aircraft.baroAltitudeFt.toLocaleString()} ft`
      : "---";

  const speedText =
    unitSystem === "metric"
      ? aircraft.velocityKmh !== null
        ? `${aircraft.velocityKmh} km/h`
        : "---"
      : aircraft.velocityKts !== null
      ? `${aircraft.velocityKts} kts`
      : "---";

  return (
    <aside className="absolute top-12 bottom-0 right-0 w-full md:w-[320px] bg-[#161a20] border-l border-[#262b33] z-20 flex flex-col select-none overflow-y-auto max-md:h-[65vh] max-md:top-auto max-md:border-t max-md:border-l-0 shadow-lg">
      {/* Header: Callsign, Origin, ICAO */}
      <div className="p-4 border-b border-[#262b33] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-mono text-[#e6e8eb] tracking-tight">
              {aircraft.callsign}
            </h2>
            {aircraft.onGround ? (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#262b33] text-[#8b929c]">
                Ground
              </span>
            ) : null}
            {isEmergency ? (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#e05252]/20 text-[#e05252] border border-[#e05252]/40 font-bold">
                Squawk {aircraft.squawk}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-[#8b929c] mt-0.5">
            {aircraft.originCountry} • <span className="font-mono uppercase">{aircraft.icao24}</span>
          </div>
        </div>

        <button
          onClick={() => setSelectedAircraft(null)}
          title="Close details"
          className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Strip: Follow Camera & Units */}
      <div className="px-4 py-2 border-b border-[#262b33] bg-[#14171c] flex items-center justify-between text-xs">
        <button
          onClick={() => setIsFollowingSelected(!isFollowingSelected)}
          className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
            isFollowingSelected
              ? "bg-[#f5a524]/20 border border-[#f5a524] text-[#f5a524]"
              : "bg-[#1f242c] border border-[#262b33] text-[#8b929c] hover:text-[#e6e8eb]"
          }`}
        >
          <Crosshair className="w-3 h-3" />
          <span>{isFollowingSelected ? "Following camera" : "Follow aircraft"}</span>
        </button>

        <button
          onClick={() => setUnitSystem(unitSystem === "aviation" ? "metric" : "aviation")}
          className="text-[11px] text-[#8b929c] hover:text-[#e6e8eb] font-mono transition-colors"
        >
          Units: {unitSystem === "aviation" ? "ft / kts" : "m / kmh"}
        </button>
      </div>

      {/* Flight Profile Chart */}
      <div className="p-4 border-b border-[#262b33]">
        <AltitudeProfileChart
          history={aircraft.history || []}
          currentAltFt={aircraft.baroAltitudeFt}
        />
      </div>

      {/* 2-Column Key/Value Table with Row Dividers */}
      <div className="divide-y divide-[#262b33] text-xs">
        {/* Altitude */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Altitude</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {aircraft.onGround ? "On Ground" : altitudeText}
          </span>
        </div>

        {/* Ground speed */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Ground speed</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {speedText}
          </span>
        </div>

        {/* Track (Heading) */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Track</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {aircraft.trueTrack !== null
              ? `${aircraft.trueTrack}° (${getHeadingCompass(aircraft.trueTrack)})`
              : "---"}
          </span>
        </div>

        {/* Vertical rate */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Vertical rate</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {getVerticalRateText()}
          </span>
        </div>

        {/* Squawk */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Squawk</span>
          <span
            className={`font-mono text-sm ${
              isEmergency ? "text-[#e05252] font-bold" : "text-[#e6e8eb]"
            }`}
          >
            {aircraft.squawk || "---"}
          </span>
        </div>

        {/* Position Coordinates */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Position</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {lat !== null && lon !== null ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "---"}
          </span>
        </div>

        {/* Last contact */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Last contact</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {secondsSinceReport}s ago
          </span>
        </div>

        {/* Tracked Waypoints */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[#8b929c]">Recorded path</span>
          <span className="font-mono tabular-nums text-xs text-[#8b929c]">
            {aircraft.history?.length || 0} waypoints
          </span>
        </div>
      </div>

      {/* Footer: Data Source Note */}
      <div className="mt-auto p-4 border-t border-[#262b33] text-[11px] text-[#8b929c]">
        <div>OpenSky ADS-B live transponder feed</div>
        {aircraft.isDeadReckoned ? (
          <div className="text-[10px] text-[#f5a524] mt-0.5">
            Position extrapolated via dead reckoning (1Hz)
          </div>
        ) : null}
      </div>
    </aside>
  );
}
