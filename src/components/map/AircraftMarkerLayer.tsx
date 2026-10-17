"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Aircraft } from "@/types/flight";

interface Props {
  map: L.Map;
}

// Altitude Color Helper
function getAltitudeColor(altFt: number | null, onGround: boolean, squawk: string | null): string {
  if (squawk === "7700" || squawk === "7600" || squawk === "7500") {
    return "#ff2a55"; // Emergency Red
  }
  if (onGround) {
    return "#ff8800"; // Ground Orange
  }
  if (altFt === null || altFt < 10000) {
    return "#00ff88"; // Low Altitude Green
  }
  if (altFt <= 25000) {
    return "#00e5ff"; // Mid Altitude Cyan
  }
  return "#b366ff"; // High Altitude Purple
}

// Creates the tactical SVG HTML for an aircraft marker
function createMarkerHtml(aircraft: Aircraft, isSelected: boolean): string {
  const heading = aircraft.trueTrack ?? 0;
  const color = getAltitudeColor(aircraft.baroAltitudeFt, aircraft.onGround, aircraft.squawk);
  const isEmergency = aircraft.squawk === "7700";
  const isStale = aircraft.isStale;

  const glowClass = isSelected
    ? "drop-shadow(0 0 8px rgba(0, 229, 255, 0.95))"
    : isEmergency
    ? "drop-shadow(0 0 10px rgba(255, 42, 85, 0.95))"
    : "drop-shadow(0 0 3px rgba(0, 0, 0, 0.6))";

  return `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 40px; height: 40px;">
      ${
        isSelected
          ? `<div class="absolute -inset-1 rounded-full border-2 border-radar-primary animate-pulse pointer-events-none"></div>`
          : ""
      }
      ${
        isEmergency
          ? `<div class="absolute -inset-2 rounded-full border-2 border-radar-red radar-ping pointer-events-none"></div>`
          : ""
      }
      <div 
        class="aircraft-marker-container" 
        style="transform: rotate(${heading}deg); filter: ${glowClass}; opacity: ${isStale ? 0.45 : 1};"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="#070c14" stroke-width="1.2">
          <!-- Tactical Jet Silhouette -->
          <path d="M12 2L14 8H19L20 10L14 13V18L16 20V22L12 21L8 22V20L10 18V13L4 10L5 8H10L12 2Z" />
        </svg>
      </div>
      ${
        isSelected
          ? `<div class="absolute -bottom-4 bg-radar-card/95 border border-radar-primary text-[10px] font-mono font-bold text-radar-primary px-1.5 py-0.2 rounded shadow-md whitespace-nowrap z-50">
              ${aircraft.callsign}
            </div>`
          : ""
      }
    </div>
  `;
}

export default function AircraftMarkerLayer({ map }: Props) {
  const {
    aircraftMap,
    selectedIcao24,
    filters,
    setSelectedAircraft,
  } = useAirspaceStore();

  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const existingMarkers = markersRef.current;
    const currentIcaos = new Set<string>();

    // Filter matching aircraft
    const aircraftList = Object.values(aircraftMap).filter((ac) => {
      // Must have valid coordinates
      const lat = ac.deadReckonedLat ?? ac.latitude;
      const lon = ac.deadReckonedLon ?? ac.longitude;
      if (lat === null || lon === null) return false;

      // Filter: Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesCallsign = ac.callsign.toLowerCase().includes(query);
        const matchesIcao = ac.icao24.toLowerCase().includes(query);
        const matchesCountry = ac.originCountry.toLowerCase().includes(query);
        if (!matchesCallsign && !matchesIcao && !matchesCountry) return false;
      }

      // Filter: Status (airborne vs ground)
      if (filters.status === "airborne" && ac.onGround) return false;
      if (filters.status === "ground" && !ac.onGround) return false;

      // Filter: Emergency squawk only
      if (filters.emergencyOnly && ac.squawk !== "7700" && ac.squawk !== "7600" && ac.squawk !== "7500") {
        return false;
      }

      // Filter: Altitude
      const alt = ac.baroAltitudeFt ?? 0;
      if (alt < filters.minAltitudeFt || alt > filters.maxAltitudeFt) return false;

      // Filter: Speed
      const speed = ac.velocityKts ?? 0;
      if (speed < filters.minSpeedKts || speed > filters.maxSpeedKts) return false;

      return true;
    });

    for (const ac of aircraftList) {
      const icao = ac.icao24;
      currentIcaos.add(icao);

      const lat = ac.deadReckonedLat ?? ac.latitude!;
      const lon = ac.deadReckonedLon ?? ac.longitude!;
      const isSelected = selectedIcao24 === icao;

      const icon = L.divIcon({
        className: "custom-aircraft-marker",
        html: createMarkerHtml(ac, isSelected),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      let marker = existingMarkers.get(icao);
      if (!marker) {
        marker = L.marker([lat, lon], { icon, zIndexOffset: isSelected ? 1000 : 100 });

        // Tooltip showing telemetry
        const tooltipContent = `
          <div class="font-mono text-xs space-y-0.5 p-1">
            <div class="font-bold text-radar-primary flex items-center justify-between gap-3">
              <span>${ac.callsign}</span>
              <span class="text-[10px] text-radar-muted font-normal">${ac.icao24.toUpperCase()}</span>
            </div>
            <div class="text-[11px] text-gray-300">
              ${ac.onGround ? "ON GROUND" : `ALT: ${ac.baroAltitudeFt?.toLocaleString() ?? "---"} FT`}
            </div>
            <div class="text-[11px] text-gray-300">
              SPD: ${ac.velocityKts ?? "---"} KTS | HDG: ${ac.trueTrack ?? "---"}&deg;
            </div>
            ${ac.squawk ? `<div class="text-[10px] text-radar-yellow">SQK: ${ac.squawk}</div>` : ""}
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: "top",
          offset: [0, -15],
          className: "atc-tactical-tooltip",
        });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAircraft(icao);
        });

        marker.addTo(map);
        existingMarkers.set(icao, marker);
      } else {
        // Update marker position & icon
        marker.setLatLng([lat, lon]);
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 1000 : 100);
      }
    }

    // Prune markers no longer matching filter or pruned from store
    existingMarkers.forEach((marker, icao) => {
      if (!currentIcaos.has(icao)) {
        marker.remove();
        existingMarkers.delete(icao);
      }
    });
  }, [aircraftMap, selectedIcao24, filters, map, setSelectedAircraft]);

  // Clean up all markers on unmount
  useEffect(() => {
    const currentMarkers = markersRef.current;
    return () => {
      currentMarkers.forEach((m) => m.remove());
      currentMarkers.clear();
    };
  }, []);

  return null;
}
