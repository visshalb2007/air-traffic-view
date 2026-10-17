"use client";

import { useEffect, useRef } from "react";
import { useAirspaceStore } from "@/store/useAirspaceStore";

/**
 * Runs a 1Hz clock that advances aircraft positions along their
 * velocity vector and heading angle between 10s OpenSky API pulses.
 */
export function useDeadReckoningLoop() {
  const { deadReckoningEnabled, tickDeadReckoning } = useAirspaceStore();
  const isTabVisibleRef = useRef(true);

  // Tab visibility listener to avoid wasteful calculations in background tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!deadReckoningEnabled) return;

    // Run extrapolation every 1000ms
    const interval = setInterval(() => {
      if (isTabVisibleRef.current) {
        tickDeadReckoning();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadReckoningEnabled, tickDeadReckoning]);
}
