"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { FlightApiResponse } from "@/types/flight";

export function useFlightPolling() {
  const {
    currentRegion,
    customBbox,
    isOfflineMode,
    isPolling,
    updateAircraftTelemetry,
    setConnectionState,
    decrementCountdown,
    setPollCountdown,
  } = useAirspaceStore();

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const isTabVisibleRef = useRef(true);

  const fetchFlights = useCallback(async () => {
    // Prevent overlapping requests
    if (isFetchingRef.current) return;

    // Throttle: enforce minimum 5s gap
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 4500) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      const params = new URLSearchParams();
      if (isOfflineMode) {
        params.set("offline", "true");
      }

      if (customBbox) {
        params.set("lamin", String(customBbox.lamin));
        params.set("lomin", String(customBbox.lomin));
        params.set("lamax", String(customBbox.lamax));
        params.set("lomax", String(customBbox.lomax));
      } else {
        params.set("region", currentRegion.id);
      }

      const res = await fetch(`/api/flights?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Proxy responded with HTTP ${res.status}`);
      }

      const data: FlightApiResponse = await res.json();
      if (data.success && data.aircraft) {
        updateAircraftTelemetry(data.aircraft, data.meta);
      }
    } catch (err: any) {
      console.error("[useFlightPolling] Error fetching flight telemetry:", err.message);
      setConnectionState("error");
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentRegion, customBbox, isOfflineMode, updateAircraftTelemetry, setConnectionState]);

  // Page Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      isTabVisibleRef.current = isVisible;

      if (isVisible) {
        // Tab became visible: check if data is stale (> 12s old)
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed > 12000 && isPolling) {
          fetchFlights();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchFlights, isPolling]);

  // Polling Interval & Countdown loop
  useEffect(() => {
    // Initial fetch on mount or region/offline switch
    fetchFlights();
    setPollCountdown(10);

    const timer = setInterval(() => {
      if (!isPolling || !isTabVisibleRef.current) {
        return;
      }

      const state = useAirspaceStore.getState();
      if (state.pollCountdown <= 1) {
        fetchFlights();
        setPollCountdown(10);
      } else {
        decrementCountdown();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchFlights, isPolling, currentRegion.id, isOfflineMode, setPollCountdown, decrementCountdown]);

  return {
    fetchFlights,
    manualRefresh: () => {
      fetchFlights();
      setPollCountdown(10);
    },
  };
}
