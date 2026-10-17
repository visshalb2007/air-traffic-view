"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { AIRSPACE_REGIONS } from "@/lib/regions";
import {
  AlertTriangle,
  Globe2,
  Plane,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ isOpen, onClose }: Props) {
  const {
    filters,
    setFilters,
    resetFilters,
    currentRegion,
    setRegion,
  } = useAirspaceStore();

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 left-4 z-20 w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-radar-card/95 border border-radar-border rounded-xl shadow-2xl backdrop-blur-md overflow-hidden font-mono text-radar-text animate-in fade-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-radar-border bg-radar-bg/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-radar-primary" />
          <span>AIRSPACE RADAR FILTERS</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetFilters}
            title="Reset all filters"
            className="p-1.5 rounded-lg hover:bg-radar-bg text-radar-muted hover:text-radar-primary transition-colors text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px]">RESET</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-radar-bg text-radar-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* Callsign / ICAO Search */}
        <div>
          <label className="text-[10px] uppercase text-radar-muted font-bold block mb-1.5">
            CALLSIGN / ICAO24 / COUNTRY
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-radar-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. BAW, DLH, France, 406f52..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="w-full bg-radar-bg border border-radar-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-radar-muted/50 focus:outline-none focus:border-radar-primary"
            />
          </div>
        </div>

        {/* Airspace Region Selector Grid */}
        <div>
          <label className="text-[10px] uppercase text-radar-muted font-bold block mb-1.5 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-radar-primary" />
            <span>SECTOR REGION</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AIRSPACE_REGIONS.map((region) => {
              const isSelected = currentRegion.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => setRegion(region)}
                  className={`p-2 rounded-lg border text-left text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-radar-primary/10 border-radar-primary text-radar-primary font-bold shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                      : "bg-radar-bg/70 border-radar-border text-radar-muted hover:text-white hover:border-radar-border/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{region.flag}</span>
                    <span className="truncate">{region.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flight Status: Airborne vs Ground */}
        <div>
          <label className="text-[10px] uppercase text-radar-muted font-bold block mb-1.5">
            FLIGHT STATUS
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["all", "airborne", "ground"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilters({ status: mode })}
                className={`py-1.5 px-2 rounded-lg border text-center uppercase text-[11px] font-bold transition-all ${
                  filters.status === mode
                    ? "bg-radar-primary/15 border-radar-primary text-radar-primary"
                    : "bg-radar-bg border-radar-border text-radar-muted hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Altitude Range Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-radar-muted uppercase font-bold">
            <span>MAX ALTITUDE</span>
            <span className="text-radar-primary">{filters.maxAltitudeFt.toLocaleString()} FT</span>
          </div>
          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={filters.maxAltitudeFt}
            onChange={(e) => setFilters({ maxAltitudeFt: Number(e.target.value) })}
            className="w-full accent-radar-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-radar-muted">
            <span>0 FT</span>
            <span>25,000 FT</span>
            <span>50,000+ FT</span>
          </div>
        </div>

        {/* Speed Range Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-radar-muted uppercase font-bold">
            <span>MAX GROUND SPEED</span>
            <span className="text-radar-primary">{filters.maxSpeedKts} KTS</span>
          </div>
          <input
            type="range"
            min={50}
            max={800}
            step={25}
            value={filters.maxSpeedKts}
            onChange={(e) => setFilters({ maxSpeedKts: Number(e.target.value) })}
            className="w-full accent-radar-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-radar-muted">
            <span>50 KTS</span>
            <span>400 KTS</span>
            <span>800+ KTS</span>
          </div>
        </div>

        {/* Emergency Squawk Filter */}
        <div className="pt-2 border-t border-radar-border">
          <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-radar-bg/60 transition-colors">
            <input
              type="checkbox"
              checked={filters.emergencyOnly}
              onChange={(e) => setFilters({ emergencyOnly: e.target.checked })}
              className="accent-radar-red w-4 h-4 rounded cursor-pointer"
            />
            <div className="flex items-center gap-1.5 text-xs text-radar-red font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>EMERGENCY SQUAWKS ONLY (7700/7600/7500)</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
