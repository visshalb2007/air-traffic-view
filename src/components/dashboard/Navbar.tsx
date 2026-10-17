"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { AIRSPACE_REGIONS } from "@/lib/regions";
import { RefreshCw, Search, X } from "lucide-react";

interface Props {
  onRefresh: () => void;
  onToggleFilters: () => void;
  onToggleTable: () => void;
  onToggleAlerts: () => void;
  onReplayIntro?: () => void;
}

export default function Navbar({
  onRefresh,
  onToggleFilters,
  onToggleTable,
  onToggleAlerts,
  onReplayIntro,
}: Props) {
  const {
    currentRegion,
    setRegion,
    customBbox,
    setCustomBbox,
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
    setSelectedAircraft,
  } = useAirspaceStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const totalAircraft = Object.keys(aircraftMap).length;
  const updateAge = Math.max(0, 10 - pollCountdown);

  // Search Results for Autocomplete Dropdown
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return Object.values(aircraftMap)
      .filter((ac) => {
        return (
          ac.callsign.toLowerCase().includes(q) ||
          ac.icao24.toLowerCase().includes(q) ||
          ac.originCountry.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [aircraftMap, searchQuery]);

  // Global Keyboard Shortcuts (/ to search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getStatusText = () => {
    if (isOfflineMode || connectionState === "fallback") return "Simulated dataset";
    if (connectionState === "rate_limited") return "Rate-limited (cooldown)";
    if (connectionState === "cached") return "Cached • " + updateAge + "s ago";
    if (connectionState === "error") return "Connection degraded";
    return "Updated " + updateAge + "s ago";
  };

  return (
    <header className="h-12 w-full bg-[#14171c] border-b border-[#262b33] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand, Region Selector, Live Count */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm text-[#e6e8eb] tracking-tight">
          SkyWatch ATC
        </span>

        <span className="h-4 w-px bg-[#262b33] hidden sm:block" />

        {/* Region Selector */}
        <select
          value={customBbox ? "custom" : currentRegion.id}
          onChange={(e) => {
            if (e.target.value === "custom") return;
            const selected = AIRSPACE_REGIONS.find((r) => r.id === e.target.value);
            if (selected) {
              setCustomBbox(null);
              setRegion(selected);
            }
          }}
          className="bg-[#161a20] border border-[#262b33] hover:border-[#38404d] text-xs text-[#e6e8eb] py-1 px-2 rounded focus:outline-none cursor-pointer transition-colors"
        >
          {customBbox && (
            <option value="custom" className="bg-[#161a20] text-[#f5a524]">
              🌐 Live Viewport (Custom)
            </option>
          )}
          {AIRSPACE_REGIONS.map((region) => (
            <option key={region.id} value={region.id} className="bg-[#161a20] text-[#e6e8eb]">
              {region.name}
            </option>
          ))}
        </select>

        {/* Tracked Count with Colorful Live Pulse */}
        <div className="flex items-center gap-1.5 text-xs text-[#8b929c] hidden md:flex">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88] animate-pulse" />
          <span>
            <strong className="text-[#00ff88] font-mono tabular-nums font-bold">
              {totalAircraft.toLocaleString()}
            </strong>{" "}
            airborne
          </span>
        </div>

        {/* Status text */}
        <span className="text-[11px] text-[#8b929c] hidden xl:inline border-l border-[#262b33] pl-3">
          {getStatusText()}
        </span>
      </div>

      {/* Center: Quick Flight Search Input with Autocomplete */}
      <div className="relative max-w-xs w-full mx-2 hidden sm:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#8b929c] absolute left-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search flights... (Press '/')"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161a20] border border-[#262b33] focus:border-[#4f5968] rounded pl-8 pr-7 py-1 text-xs text-[#e6e8eb] placeholder-[#555d68] focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-[#8b929c] hover:text-[#e6e8eb]"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <span className="absolute right-2 text-[10px] text-[#555d68] font-mono border border-[#262b33] px-1 rounded pointer-events-none">
              /
            </span>
          )}
        </div>

        {/* Instant Autocomplete Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-9 left-0 right-0 bg-[#161a20] border border-[#262b33] rounded shadow-2xl z-50 overflow-hidden divide-y divide-[#262b33]/60">
            {searchResults.map((ac) => (
              <div
                key={ac.icao24}
                onMouseDown={() => {
                  setSelectedAircraft(ac.icao24);
                  setIsSearchFocused(false);
                  setSearchQuery("");
                }}
                className="px-3 py-2 hover:bg-[#1f242c] cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-mono font-semibold text-[#e6e8eb]">{ac.callsign}</div>
                  <div className="text-[10px] text-[#8b929c]">{ac.originCountry} • {ac.icao24.toUpperCase()}</div>
                </div>
                <div className="text-right font-mono text-[11px] tabular-nums text-[#8b929c]">
                  <div>{ac.onGround ? "Ground" : `${ac.baroAltitudeFt?.toLocaleString()} ft`}</div>
                  <div>{ac.velocityKts ? `${ac.velocityKts} kts` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Functional text buttons & controls */}
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
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors hidden md:block ${
            deadReckoningEnabled
              ? "text-[#f5a524] hover:bg-[#1e232b]"
              : "text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1e232b]"
          }`}
          title="Toggle 1Hz Dead Reckoning Motion Extrapolation"
        >
          DR: {deadReckoningEnabled ? "On" : "Off"}
        </button>

        {/* Trails Toggle */}
        <button
          onClick={toggleShowTrails}
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors hidden md:block ${
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

        {/* Flyover Intro Replay */}
        {onReplayIntro && (
          <button
            onClick={onReplayIntro}
            title="Play cinematic jet flyover animation"
            className="px-2 py-1 rounded text-[11px] font-sans text-[#00e5ff] hover:bg-[#1e232b] border border-[#00e5ff]/30 transition-colors hidden lg:flex items-center gap-1"
          >
            <span>✈ Flyover</span>
          </button>
        )}

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
