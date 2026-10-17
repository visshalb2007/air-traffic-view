"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import AircraftMarkerLayer from "./AircraftMarkerLayer";
import FlightPathTrailLayer from "./FlightPathTrailLayer";

export default function ATCMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const { currentRegion, setSelectedAircraft } = useAirspaceStore();

  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    // Initialize Leaflet Map
    const leafletMap = L.map(mapContainerRef.current, {
      center: currentRegion.center,
      zoom: currentRegion.zoom,
      minZoom: 3,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    // Clean, Keyless Dark Gray Basemap (Free, no watermark)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> | OpenSky ADS-B',
        maxZoom: 16,
      }
    ).addTo(leafletMap);

    // Flat, square zoom control at bottom right
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(leafletMap);

    // Deselect aircraft on map background click
    leafletMap.on("click", () => {
      setSelectedAircraft(null);
    });

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
      setMap(null);
    };
  }, []);

  // Update view when region changes
  useEffect(() => {
    if (!map) return;
    map.flyTo(currentRegion.center, currentRegion.zoom, {
      duration: 1.0,
      easeLinearity: 0.2,
    });
  }, [currentRegion, map]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-atc-bg">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Aircraft markers and flight trails */}
      {map && (
        <>
          <FlightPathTrailLayer map={map} />
          <AircraftMarkerLayer map={map} />
        </>
      )}
    </div>
  );
}
