"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import AircraftMarkerLayer from "./AircraftMarkerLayer";
import FlightPathTrailLayer from "./FlightPathTrailLayer";

const BASEMAP_TILES = {
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin &copy; OpenStreetMap | OpenSky ADS-B',
    maxZoom: 16,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics | OpenSky ADS-B',
    maxZoom: 18,
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OpenSky ADS-B',
    maxZoom: 19,
  },
};

export default function ATCMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const {
    currentRegion,
    setSelectedAircraft,
    basemap,
    setBasemap,
    flyToTarget,
    triggerFlyTo,
    isFollowingSelected,
    selectedIcao24,
    aircraftMap,
  } = useAirspaceStore();

  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    // Initialize Leaflet Map
    const leafletMap = L.map(mapContainerRef.current, {
      center: currentRegion.center,
      zoom: currentRegion.zoom,
      minZoom: 3,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
    });

    const activeTileConfig = BASEMAP_TILES[basemap] || BASEMAP_TILES.dark;
    const initialLayer = L.tileLayer(activeTileConfig.url, {
      attribution: activeTileConfig.attribution,
      maxZoom: activeTileConfig.maxZoom,
    }).addTo(leafletMap);

    tileLayerRef.current = initialLayer;

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

  // Switch basemap layer dynamically
  useEffect(() => {
    if (!map) return;
    const config = BASEMAP_TILES[basemap] || BASEMAP_TILES.dark;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [basemap, map]);

  // Handle region switch (automatically frames the sector's bounding box)
  useEffect(() => {
    if (!map) return;
    map.fitBounds(
      [
        [currentRegion.bbox.lamin, currentRegion.bbox.lomin],
        [currentRegion.bbox.lamax, currentRegion.bbox.lomax],
      ],
      {
        padding: [30, 30],
        maxZoom: 7,
        animate: true,
        duration: 1.0,
      }
    );
  }, [currentRegion, map]);

  // Handle fly-to target (when aircraft is clicked in search or roster)
  useEffect(() => {
    if (!map || !flyToTarget) return;
    map.flyTo(flyToTarget, Math.max(map.getZoom(), 8), {
      duration: 0.9,
    });
    triggerFlyTo(null);
  }, [flyToTarget, map, triggerFlyTo]);

  // Handle continuous camera follow mode
  useEffect(() => {
    if (!map || !isFollowingSelected || !selectedIcao24) return;
    const ac = aircraftMap[selectedIcao24];
    if (!ac) return;
    const lat = ac.deadReckonedLat ?? ac.latitude;
    const lon = ac.deadReckonedLon ?? ac.longitude;
    if (lat !== null && lon !== null) {
      map.panTo([lat, lon], { animate: true, duration: 0.5 });
    }
  }, [aircraftMap, selectedIcao24, isFollowingSelected, map]);

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

      {/* Operational Basemap Switcher (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center bg-[#161a20]/95 border border-[#262b33] rounded overflow-hidden text-xs shadow-md">
        {(
          [
            { id: "dark", label: "Dark Gray" },
            { id: "satellite", label: "Satellite" },
            { id: "osm", label: "OSM" },
          ] as const
        ).map((b) => (
          <button
            key={b.id}
            onClick={() => setBasemap(b.id)}
            className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
              basemap === b.id
                ? "bg-[#262b33] text-[#f5a524]"
                : "text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c]"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
