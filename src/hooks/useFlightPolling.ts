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

  const fetchFlights = useCallback(
    async (forceImmediate = false) => {
      // Prevent overlapping requests
      if (isFetchingRef.current) return;

      // Throttle: enforce minimum 4s gap unless forceImmediate is requested (e.g. map pan or region switch)
      const now = Date.now();
      if (!forceImmediate && now - lastFetchTimeRef.current < 4000) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;

      try {
        const state = useAirspaceStore.getState();
        const bbox = state.customBbox;
        const region = state.currentRegion;

        const params = new URLSearchParams();
        if (state.isOfflineMode) {
          params.set("offline", "true");
        }

        if (bbox) {
          params.set("lamin", String(bbox.lamin));
          params.set("lomin", String(bbox.lomin));
          params.set("lamax", String(bbox.lamax));
          params.set("lomax", String(bbox.lomax));
        } else {
          params.set("region", region.id);
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
    },
    [updateAircraftTelemetry, setConnectionState]
  );

  // Debounced fetch when user moves/zooms the map to a new central location
  useEffect(() => {
    if (!customBbox) return;

    const timer = setTimeout(() => {
      fetchFlights(true);
      setPollCountdown(10);
    }, 450);

    return () => clearTimeout(timer);
  }, [customBbox, fetchFlights, setPollCountdown]);

  // Page Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      isTabVisibleRef.current = isVisible;

      if (isVisible) {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed > 12000 && isPolling) {
          fetchFlights(true);
          setPollCountdown(10);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchFlights, isPolling, setPollCountdown]);

  // Polling Interval & Countdown loop
  useEffect(() => {
    // Initial fetch on mount or region/offline switch
    fetchFlights(true);
    setPollCountdown(10);

    const timer = setInterval(() => {
      if (!isPolling || !isTabVisibleRef.current) {
        return;
      }

      const state = useAirspaceStore.getState();
      if (state.pollCountdown <= 1) {
        fetchFlights(true);
        setPollCountdown(10);
      } else {
        decrementCountdown();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchFlights, isPolling, currentRegion.id, isOfflineMode, setPollCountdown, decrementCountdown]);

  return {
    fetchFlights: () => fetchFlights(true),
    manualRefresh: () => {
      fetchFlights(true);
      setPollCountdown(10);
    },
  };
}
