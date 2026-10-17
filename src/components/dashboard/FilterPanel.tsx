"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { AIRSPACE_REGIONS } from "@/lib/regions";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterPanel({ isOpen, onClose }: Props) {
  const { filters, setFilters, resetFilters, currentRegion, setRegion } = useAirspaceStore();

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 left-4 z-20 w-80 max-w-[calc(100vw-2rem)] bg-[#161a20] border border-[#262b33] rounded shadow-xl text-[#e6e8eb] select-none text-xs">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#262b33] flex items-center justify-between">
        <span className="font-semibold text-sm text-[#e6e8eb]">Airspace Filters</span>
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="text-[11px] text-[#8b929c] hover:text-[#e6e8eb] transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        {/* Search */}
        <div>
          <label className="text-xs text-[#8b929c] block mb-1">
            Callsign, ICAO, or Country
          </label>
          <input
            type="text"
            placeholder="e.g. BAW, 39DE4A, France..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="w-full bg-[#0f1216] border border-[#262b33] focus:border-[#4f5968] rounded px-2.5 py-1.5 text-xs text-[#e6e8eb] placeholder-[#555d68] focus:outline-none"
          />
        </div>

        {/* Region Presets */}
        <div>
          <label className="text-xs text-[#8b929c] block mb-1">Sector Region</label>
          <div className="grid grid-cols-2 gap-1.5">
            {AIRSPACE_REGIONS.map((region) => {
              const isSelected = currentRegion.id === region.id;
              return (
                <button
                  key={region.id}
                  onClick={() => setRegion(region)}
                  className={`px-2 py-1.5 rounded border text-left text-xs transition-colors truncate ${
                    isSelected
                      ? "bg-[#1f242c] border-[#f5a524] text-[#f5a524] font-medium"
                      : "bg-[#0f1216] border-[#262b33] text-[#8b929c] hover:text-[#e6e8eb] hover:border-[#38404d]"
                  }`}
                >
                  {region.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status: All / Airborne / Ground */}
        <div>
          <label className="text-xs text-[#8b929c] block mb-1">Flight Status</label>
          <div className="grid grid-cols-3 gap-1">
            {(["all", "airborne", "ground"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilters({ status: mode })}
                className={`py-1 rounded border capitalize text-xs transition-colors ${
                  filters.status === mode
                    ? "bg-[#1f242c] border-[#f5a524] text-[#f5a524] font-medium"
                    : "bg-[#0f1216] border-[#262b33] text-[#8b929c] hover:text-[#e6e8eb]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Maximum Altitude Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b929c]">Maximum altitude</span>
            <span className="font-mono tabular-nums text-[#e6e8eb]">
              {filters.maxAltitudeFt.toLocaleString()} ft
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={filters.maxAltitudeFt}
            onChange={(e) => setFilters({ maxAltitudeFt: Number(e.target.value) })}
            className="w-full accent-[#f5a524] cursor-pointer"
          />
        </div>

        {/* Maximum Ground Speed Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b929c]">Maximum ground speed</span>
            <span className="font-mono tabular-nums text-[#e6e8eb]">
              {filters.maxSpeedKts} kts
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={800}
            step={25}
            value={filters.maxSpeedKts}
            onChange={(e) => setFilters({ maxSpeedKts: Number(e.target.value) })}
            className="w-full accent-[#f5a524] cursor-pointer"
          />
        </div>

        {/* Emergency Squawk Filter */}
        <div className="pt-2 border-t border-[#262b33]">
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={filters.emergencyOnly}
              onChange={(e) => setFilters({ emergencyOnly: e.target.checked })}
              className="accent-[#f5a524] w-3.5 h-3.5 rounded"
            />
            <span className="text-xs text-[#e6e8eb]">
              Emergency squawks only (7700 / 7600 / 7500)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
