"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";

export default function SimulationBanner() {
  const { isOfflineMode, toggleOfflineMode, currentRegion, connectionState } = useAirspaceStore();

  if (!isOfflineMode && connectionState !== "fallback" && connectionState !== "rate_limited") {
    return null;
  }

  const isRateLimited = connectionState === "rate_limited";

  return (
    <div className="w-full px-4 py-1.5 text-xs font-sans flex items-center justify-between border-b border-[#262b33] bg-[#1a1f26] text-[#8b929c] z-20">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f5a524]" />
        <span>
          {isRateLimited
            ? "API rate-limit cooldown: Temporarily serving cached/recorded snapshot."
            : `Simulation mode active: Displaying recorded ADS-B dataset for ${currentRegion.name}.`}
        </span>
      </div>

      {isOfflineMode ? (
        <button
          onClick={toggleOfflineMode}
          className="text-xs text-[#f5a524] hover:underline font-medium"
        >
          Switch to live API
        </button>
      ) : null}
    </div>
  );
}
