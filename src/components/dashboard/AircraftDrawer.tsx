"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import {
  Compass,
  Gauge,
  MapPin,
  Plane,
  Radio,
  TrendingDown,
  TrendingUp,
  X,
  Clock,
  ShieldAlert,
  Activity,
  Layers,
} from "lucide-react";

export default function AircraftDrawer() {
  const { aircraftMap, selectedIcao24, setSelectedAircraft } = useAirspaceStore();

  if (!selectedIcao24) return null;

  const aircraft = aircraftMap[selectedIcao24];
  if (!aircraft) return null;

  const lat = aircraft.deadReckonedLat ?? aircraft.latitude;
  const lon = aircraft.deadReckonedLon ?? aircraft.longitude;

  const isEmergency =
    aircraft.squawk === "7700" || aircraft.squawk === "7600" || aircraft.squawk === "7500";

  const getVerticalIndicator = () => {
    const rate = aircraft.verticalRateFpm;
    if (rate === null || Math.abs(rate) < 100) {
      return { text: "LEVEL CRUISE", color: "text-radar-text", icon: Activity };
    }
    if (rate > 0) {
      return {
        text: `CLIMBING (+${rate.toLocaleString()} FPM)`,
        color: "text-emerald-400",
        icon: TrendingUp,
      };
    }
    return {
      text: `DESCENDING (${rate.toLocaleString()} FPM)`,
      color: "text-rose-400",
      icon: TrendingDown,
    };
  };

  const vertInfo = getVerticalIndicator();
  const VertIcon = vertInfo.icon;

  const secondsSinceReport = Math.max(
    0,
    Math.round((Date.now() - (aircraft.timePosition ? aircraft.timePosition * 1000 : aircraft.lastContact * 1000 || aircraft.lastSeenAt)) / 1000)
  );

  return (
    <div className="absolute top-20 right-4 z-20 w-84 md:w-96 max-w-[calc(100vw-2rem)] bg-radar-card/95 border border-radar-border rounded-xl shadow-2xl backdrop-blur-md overflow-hidden font-mono text-radar-text animate-in fade-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div
        className={`p-4 border-b ${
          isEmergency
            ? "bg-rose-950/80 border-rose-500/80"
            : "bg-radar-bg/60 border-radar-border"
        } flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-radar-bg border border-radar-border">
            <Plane
              className={`w-6 h-6 ${
                isEmergency ? "text-radar-red animate-pulse" : "text-radar-primary"
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-wider">
                {aircraft.callsign}
              </span>
              {aircraft.onGround ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                  GROUND
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  AIRBORNE
                </span>
              )}
            </div>
            <div className="text-xs text-radar-muted flex items-center gap-2">
              <span>{aircraft.originCountry}</span>
              <span>•</span>
              <span className="uppercase text-radar-primary font-bold">
                {aircraft.icao24}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSelectedAircraft(null)}
          className="p-1.5 rounded-lg bg-radar-bg/50 hover:bg-radar-bg text-radar-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Emergency Alert Banner if squawking */}
      {isEmergency && (
        <div className="bg-radar-red text-white px-4 py-2 text-xs font-bold flex items-center gap-2 animate-pulse">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>EMERGENCY SQUAWK {aircraft.squawk} REPORTED!</span>
        </div>
      )}

      {/* Primary Telemetry Grid */}
      <div className="p-4 space-y-4 text-xs">
        {/* Altitude & Speed Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Altitude */}
          <div className="p-3 rounded-lg bg-radar-bg/80 border border-radar-border">
            <div className="text-[10px] text-radar-muted uppercase flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-radar-primary" />
              <span>ALTITUDE</span>
            </div>
            <div className="text-lg font-black text-white">
              {aircraft.baroAltitudeFt !== null
                ? `${aircraft.baroAltitudeFt.toLocaleString()} FT`
                : "N/A"}
            </div>
            <div className="text-[10px] text-radar-muted">
              {aircraft.baroAltitude !== null ? `${aircraft.baroAltitude.toLocaleString()} m (Baro)` : ""}
            </div>
          </div>

          {/* Speed */}
          <div className="p-3 rounded-lg bg-radar-bg/80 border border-radar-border">
            <div className="text-[10px] text-radar-muted uppercase flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5 text-radar-primary" />
              <span>GROUND SPEED</span>
            </div>
            <div className="text-lg font-black text-white">
              {aircraft.velocityKts !== null ? `${aircraft.velocityKts} KTS` : "N/A"}
            </div>
            <div className="text-[10px] text-radar-muted">
              {aircraft.velocityKmh !== null ? `${aircraft.velocityKmh} km/h` : ""}
            </div>
          </div>
        </div>

        {/* Heading & Vertical Rate */}
        <div className="grid grid-cols-2 gap-3">
          {/* Heading */}
          <div className="p-3 rounded-lg bg-radar-bg/80 border border-radar-border">
            <div className="text-[10px] text-radar-muted uppercase flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-radar-primary" />
              <span>TRUE TRACK</span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{aircraft.trueTrack !== null ? `${aircraft.trueTrack}°` : "---"}</span>
              {aircraft.trueTrack !== null && (
                <div
                  className="w-4 h-4 rounded-full border border-radar-primary/50 flex items-center justify-center"
                  style={{ transform: `rotate(${aircraft.trueTrack}deg)` }}
                >
                  <span className="w-1 h-2 bg-radar-primary rounded-t" />
                </div>
              )}
            </div>
          </div>

          {/* Squawk */}
          <div className="p-3 rounded-lg bg-radar-bg/80 border border-radar-border">
            <div className="text-[10px] text-radar-muted uppercase flex items-center gap-1.5 mb-1">
              <Radio className="w-3.5 h-3.5 text-radar-primary" />
              <span>SQUAWK</span>
            </div>
            <div
              className={`text-base font-bold ${
                isEmergency ? "text-radar-red font-black" : "text-radar-yellow"
              }`}
            >
              {aircraft.squawk || "NONE"}
            </div>
          </div>
        </div>

        {/* Vertical Rate Indicator */}
        <div className="p-2.5 rounded-lg bg-radar-bg/80 border border-radar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VertIcon className={`w-4 h-4 ${vertInfo.color}`} />
            <span className={`text-xs font-semibold ${vertInfo.color}`}>{vertInfo.text}</span>
          </div>
        </div>

        {/* Coordinates & Dead Reckoning status */}
        <div className="p-3 rounded-lg bg-radar-bg/80 border border-radar-border space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-radar-muted flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-radar-primary" />
              COORDINATES:
            </span>
            <span className="text-white font-medium">
              {lat?.toFixed(4)}, {lon?.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-radar-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-radar-muted" />
              LAST CONTACT:
            </span>
            <span className="text-radar-text">{secondsSinceReport}s ago</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-radar-muted">TRAIL WAYPOINTS:</span>
            <span className="text-radar-primary font-bold">{aircraft.history?.length || 0}</span>
          </div>
          {aircraft.isDeadReckoned && (
            <div className="text-[10px] text-radar-primary/80 pt-1 border-t border-radar-border/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-radar-primary animate-pulse" />
              Estimated via Dead Reckoning between API pulses
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
