"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Database, Radio, Sparkles, WifiOff } from "lucide-react";

export default function SimulationBanner() {
  const { isOfflineMode, toggleOfflineMode, currentRegion, connectionState } = useAirspaceStore();

  if (!isOfflineMode && connectionState !== "fallback" && connectionState !== "rate_limited") {
    return null;
  }

  const isRateLimited = connectionState === "rate_limited";

  return (
    <div
      className={`w-full px-4 py-2 text-xs font-mono flex items-center justify-between border-b z-20 transition-all ${
        isRateLimited
          ? "bg-amber-950/80 border-amber-500/60 text-amber-300"
          : "bg-purple-950/80 border-purple-500/50 text-purple-200"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isRateLimited ? (
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
        ) : (
          <Database className="w-4 h-4 text-purple-400 shrink-0" />
        )}
        <div>
          <span className="font-bold">
            {isRateLimited
              ? "RATE-LIMIT RECOVERY MODE ACTIVE:"
              : "OFFLINE SIMULATION MODE ACTIVE:"}
          </span>{" "}
          <span className="opacity-90">
            {isRateLimited
              ? "OpenSky 429 rate limit reached. Resilient cached/recorded snapshot automatically engaged."
              : `Rendering pre-recorded high-density ADS-B snapshot for ${currentRegion.name}.`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOfflineMode ? (
          <button
            onClick={toggleOfflineMode}
            className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 text-purple-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-radar-primary" />
            <span>SWITCH TO LIVE OPENSKY API</span>
          </button>
        ) : (
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-black/40 border border-amber-500/40 font-bold">
            Auto-recovering in 10s
          </span>
        )}
      </div>
    </div>
  );
}
