"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import AircraftMarkerLayer from "./AircraftMarkerLayer";
import FlightPathTrailLayer from "./FlightPathTrailLayer";

export default function ATCMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const { currentRegion, setSelectedAircraft } = useAirspaceStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: currentRegion.center,
      zoom: currentRegion.zoom,
      minZoom: 3,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark Matter Tactical Radar Tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a> | Live OpenSky ADS-B',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    // Deselect aircraft on map background click
    map.on("click", () => {
      setSelectedAircraft(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update view when region changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(currentRegion.center, currentRegion.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [currentRegion]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-radar-bg">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Child layers connected to the Leaflet map instance */}
      {mapInstanceRef.current && (
        <>
          <FlightPathTrailLayer map={mapInstanceRef.current} />
          <AircraftMarkerLayer map={mapInstanceRef.current} />
        </>
      )}

      {/* Radar Vignette & HUD Crosshair Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_80px_rgba(7,12,20,0.85)]" />

      {/* Radar Sweep Effect (toggleable visual atmosphere) */}
      <div className="pointer-events-none absolute -inset-[100%] z-10 opacity-[0.03] animate-radar-sweep bg-[conic-gradient(from_0deg_at_50%_50%,rgba(0,229,255,0.8)_0deg,transparent_60deg,transparent_360deg)]" />
    </div>
  );
}
