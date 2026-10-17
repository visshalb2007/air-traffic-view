"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { AIRSPACE_REGIONS } from "@/lib/regions";
import {
  Activity,
  AlertTriangle,
  Compass,
  Globe2,
  ListFilter,
  Plane,
  RefreshCw,
  Radio,
  SlidersHorizontal,
  TableProperties,
} from "lucide-react";
import { AirspaceRegion } from "@/types/flight";

interface Props {
  onRefresh: () => void;
  onToggleFilters: () => void;
  onToggleTable: () => void;
  onToggleAlerts: () => void;
}

export default function Navbar({
  onRefresh,
  onToggleFilters,
  onToggleTable,
  onToggleAlerts,
}: Props) {
  const {
    currentRegion,
    setRegion,
    connectionState,
    apiMeta,
    aircraftMap,
    pollCountdown,
    isOfflineMode,
    toggleOfflineMode,
    deadReckoningEnabled,
    toggleDeadReckoning,
    showTrails,
    toggleShowTrails,
    unreadAlertCount,
  } = useAirspaceStore();

  const totalAircraft = Object.keys(aircraftMap).length;

  // Status Badge Helper
  const getStatusBadge = () => {
    switch (connectionState) {
      case "live":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wider">LIVE</span>
            {apiMeta?.responseTimeMs ? (
              <span className="text-[10px] text-emerald-500/80">({apiMeta.responseTimeMs}ms)</span>
            ) : null}
          </div>
        );
      case "cached":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-semibold tracking-wider">CACHED</span>
            {apiMeta?.expiresInSeconds !== undefined && (
              <span className="text-[10px] text-cyan-500/80">({apiMeta.expiresInSeconds}s)</span>
            )}
          </div>
        );
      case "rate_limited":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500/50 text-amber-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold tracking-wider">RATE LIMITED (429)</span>
          </div>
        );
      case "fallback":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/50 text-purple-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="font-semibold tracking-wider">SIMULATION / OFFLINE</span>
          </div>
        );
      case "error":
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="font-semibold tracking-wider">DEGRADED</span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 w-full bg-radar-card/95 border-b border-radar-border backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Airspace Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center p-2 rounded-lg bg-radar-bg border border-radar-border shadow-inner">
            <Radio className="w-5 h-5 text-radar-primary animate-pulse" />
            <div className="absolute inset-0 rounded-lg border border-radar-primary/30 animate-ping pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-black tracking-wider text-white">
                SKYWATCH<span className="text-radar-primary">.ATC</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-radar-primary/10 border border-radar-primary/30 text-radar-primary font-bold">
                RADAR v2.4
              </span>
            </div>
            <div className="text-[11px] font-mono text-radar-muted">
              Live OpenSky ADS-B Telemetry Surveillance
            </div>
          </div>
        </div>

        {/* Airspace Region Selector */}
        <div className="hidden md:flex items-center gap-1.5 bg-radar-bg/80 border border-radar-border rounded-lg p-1">
          <Globe2 className="w-3.5 h-3.5 text-radar-primary ml-1.5" />
          <select
            value={currentRegion.id}
            onChange={(e) => {
              const selected = AIRSPACE_REGIONS.find((r) => r.id === e.target.value);
              if (selected) setRegion(selected);
            }}
            className="bg-transparent text-xs font-mono text-radar-text font-medium py-1 px-2 focus:outline-none cursor-pointer"
          >
            {AIRSPACE_REGIONS.map((region) => (
              <option key={region.id} value={region.id} className="bg-radar-card text-white">
                {region.flag} {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Radar Metric Chips */}
      <div className="hidden lg:flex items-center gap-3 font-mono text-xs">
        {/* Total Aircraft in Sector */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-radar-bg/80 border border-radar-border rounded-lg shadow-sm">
          <Plane className="w-4 h-4 text-radar-primary" />
          <span className="text-radar-muted">TRACKED:</span>
          <span className="font-bold text-white tracking-wider text-sm">{totalAircraft}</span>
        </div>

        {/* Radar Sweep Countdown */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-radar-bg/80 border border-radar-border rounded-lg shadow-sm">
          <Activity className="w-4 h-4 text-radar-green animate-pulse" />
          <span className="text-radar-muted">SWEEP:</span>
          <span className="font-bold text-radar-green w-5 text-right">{pollCountdown}s</span>
        </div>

        {/* Connection State Badge */}
        {getStatusBadge()}
      </div>

      {/* Action Controls & Toggles */}
      <div className="flex items-center gap-2">
        {/* Dead Reckoning Toggle */}
        <button
          onClick={toggleDeadReckoning}
          title="Toggle 1Hz Mathematical Motion Extrapolation between updates"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            deadReckoningEnabled
              ? "bg-radar-primary/10 border-radar-primary text-radar-primary shadow-[0_0_8px_rgba(0,229,255,0.2)]"
              : "bg-radar-bg border-radar-border text-radar-muted hover:text-white"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">DR</span>
          <span className="text-[10px] font-bold">{deadReckoningEnabled ? "ON" : "OFF"}</span>
        </button>

        {/* Flight Trails Toggle */}
        <button
          onClick={toggleShowTrails}
          title="Toggle Flight Path Breadcrumbs Trail"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            showTrails
              ? "bg-radar-primary/10 border-radar-primary text-radar-primary shadow-[0_0_8px_rgba(0,229,255,0.2)]"
              : "bg-radar-bg border-radar-border text-radar-muted hover:text-white"
          }`}
        >
          <span className="hidden sm:inline">TRAILS</span>
          <span className="text-[10px] font-bold">{showTrails ? "ON" : "OFF"}</span>
        </button>

        {/* Offline Mode Toggle */}
        <button
          onClick={toggleOfflineMode}
          title="Switch between Live OpenSky API and Offline Recorded Airspace"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            isOfflineMode
              ? "bg-purple-900/40 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(179,102,255,0.3)]"
              : "bg-radar-bg border-radar-border text-radar-muted hover:text-white"
          }`}
        >
          <span>SIM</span>
          <span className="text-[10px] font-bold">{isOfflineMode ? "ACTIVE" : "OFF"}</span>
        </button>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          title="Open Airspace Filter Panel"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-radar-bg border border-radar-border text-radar-text hover:text-radar-primary hover:border-radar-primary/50 text-xs font-mono transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">FILTER</span>
        </button>

        {/* Flight Roster Table Toggle */}
        <button
          onClick={onToggleTable}
          title="Toggle Airspace Flight Roster Table"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-radar-bg border border-radar-border text-radar-text hover:text-radar-primary hover:border-radar-primary/50 text-xs font-mono transition-all"
        >
          <TableProperties className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ROSTER</span>
        </button>

        {/* Alerts Center */}
        <button
          onClick={onToggleAlerts}
          title="View Active ATC Alerts & Emergency Squawks"
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            unreadAlertCount > 0
              ? "bg-rose-950/70 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_10px_rgba(255,42,85,0.4)]"
              : "bg-radar-bg border-radar-border text-radar-muted hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-radar-red" />
          <span className="hidden sm:inline">ALERTS</span>
          {unreadAlertCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-radar-red text-white text-[10px] font-bold">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          title="Manually trigger immediate radar scan"
          className="p-2 rounded-lg bg-radar-primary/10 hover:bg-radar-primary/20 border border-radar-primary/40 text-radar-primary transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
