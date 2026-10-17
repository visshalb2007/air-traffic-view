"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { AIRSPACE_REGIONS } from "@/lib/regions";
import { RefreshCw } from "lucide-react";

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
  const updateAge = Math.max(0, 10 - pollCountdown);

  const getStatusText = () => {
    if (isOfflineMode || connectionState === "fallback") return "Simulated dataset";
    if (connectionState === "rate_limited") return "Rate-limited (cooldown)";
    if (connectionState === "cached") return "Cached • Updated " + updateAge + "s ago";
    if (connectionState === "error") return "Connection degraded";
    return "Updated " + updateAge + "s ago";
  };

  return (
    <header className="h-12 w-full bg-[#14171c] border-b border-[#262b33] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Plain title, Region, Count, Status */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm text-[#e6e8eb] tracking-tight">
          SkyWatch ATC
        </span>

        <span className="h-4 w-px bg-[#262b33] hidden sm:block" />

        {/* Region Selector */}
        <select
          value={currentRegion.id}
          onChange={(e) => {
            const selected = AIRSPACE_REGIONS.find((r) => r.id === e.target.value);
            if (selected) setRegion(selected);
          }}
          className="bg-[#161a20] border border-[#262b33] hover:border-[#38404d] text-xs text-[#e6e8eb] py-1 px-2 rounded focus:outline-none cursor-pointer transition-colors"
        >
          {AIRSPACE_REGIONS.map((region) => (
            <option key={region.id} value={region.id} className="bg-[#161a20] text-[#e6e8eb]">
              {region.name}
            </option>
          ))}
        </select>

        {/* Tracked Count */}
        <span className="text-xs text-[#8b929c] hidden md:inline">
          <strong className="text-[#e6e8eb] font-mono tabular-nums font-semibold">
            {totalAircraft.toLocaleString()}
          </strong>{" "}
          airborne
        </span>

        {/* Status text */}
        <span className="text-[11px] text-[#8b929c] hidden lg:inline border-l border-[#262b33] pl-3">
          {getStatusText()}
        </span>
      </div>

      {/* Right: Functional text buttons */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          onClick={onToggleFilters}
          className="px-2.5 py-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b] transition-colors"
        >
          Filters
        </button>

        <button
          onClick={onToggleTable}
          className="px-2.5 py-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b] transition-colors"
        >
          Roster
        </button>

        <button
          onClick={onToggleAlerts}
          className="px-2.5 py-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b] transition-colors relative flex items-center gap-1.5"
        >
          <span>Alerts</span>
          {unreadAlertCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-[#e05252] text-white text-[10px] font-mono tabular-nums font-bold">
              {unreadAlertCount}
            </span>
          )}
        </button>

        <span className="h-3.5 w-px bg-[#262b33] mx-1 hidden sm:block" />

        {/* Dead Reckoning Toggle */}
        <button
          onClick={toggleDeadReckoning}
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors hidden sm:block ${
            deadReckoningEnabled
              ? "text-[#f5a524] hover:bg-[#1e232b]"
              : "text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b]"
          }`}
          title="Toggle Dead Reckoning Interpolation"
        >
          DR: {deadReckoningEnabled ? "On" : "Off"}
        </button>

        {/* Trails Toggle */}
        <button
          onClick={toggleShowTrails}
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors hidden sm:block ${
            showTrails
              ? "text-[#f5a524] hover:bg-[#1e232b]"
              : "text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b]"
          }`}
          title="Toggle Flight Path Trails"
        >
          Trails: {showTrails ? "On" : "Off"}
        </button>

        {/* Simulation Toggle */}
        <button
          onClick={toggleOfflineMode}
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
            isOfflineMode
              ? "text-[#f5a524] bg-[#1e232b]"
              : "text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b]"
          }`}
          title="Toggle Offline Simulation Dataset"
        >
          Sim: {isOfflineMode ? "On" : "Off"}
        </button>

        {/* Subtle Refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh airspace data"
          className="p-1.5 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b] transition-colors ml-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
