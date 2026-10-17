"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { X } from "lucide-react";

function getHeadingCompass(degrees: number | null): string {
  if (degrees === null) return "---";
  const sectors = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return sectors[index];
}

export default function AircraftDrawer() {
  const { aircraftMap, selectedIcao24, setSelectedAircraft } = useAirspaceStore();

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
          title="Close aircraft details"
          className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Column Key/Value Table with Row Dividers */}
      <div className="divide-y divide-[#262b33] text-xs">
        {/* Altitude */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Altitude</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {aircraft.onGround
              ? "On Ground"
              : aircraft.baroAltitudeFt !== null
              ? `${aircraft.baroAltitudeFt.toLocaleString()} ft`
              : "---"}
          </span>
        </div>

        {/* Ground speed */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Ground speed</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {aircraft.velocityKts !== null ? `${aircraft.velocityKts} kts` : "---"}
          </span>
        </div>

        {/* Track (Heading) */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Track</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {aircraft.trueTrack !== null
              ? `${aircraft.trueTrack}° (${getHeadingCompass(aircraft.trueTrack)})`
              : "---"}
          </span>
        </div>

        {/* Vertical rate */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Vertical rate</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {getVerticalRateText()}
          </span>
        </div>

        {/* Squawk */}
        <div className="px-4 py-2.5 flex items-center justify-between">
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
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Position</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {lat !== null && lon !== null ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : "---"}
          </span>
        </div>

        {/* Last contact */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <span className="text-[#8b929c]">Last contact</span>
          <span className="font-mono tabular-nums text-sm text-[#e6e8eb]">
            {secondsSinceReport}s ago
          </span>
        </div>

        {/* Tracked Waypoints */}
        <div className="px-4 py-2.5 flex items-center justify-between">
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
            Position extrapolated via dead reckoning
          </div>
        ) : null}
      </div>
    </aside>
  );
}
