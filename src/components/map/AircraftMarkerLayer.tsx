"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Aircraft } from "@/types/flight";

interface Props {
  map: L.Map;
}

/**
 * Vivid, colorful altitude-band palette (Flightradar24 / aviation radar style):
 * - Ground: Safety Orange (#ff8800)
 * - Low (< 10,000 ft): Vivid Emerald Green (#00ff88)
 * - Mid (10,000 - 25,000 ft): Sky Cyan (#00e5ff)
 * - High Cruise (25,000 - 38,000 ft): Golden Amber (#ffcc00)
 * - Upper Airspace (> 38,000 ft): Electric Magenta (#e040fb)
 * - Emergency Squawk: Vivid Red (#ff1744)
 * - Selected: Pure White (#ffffff) with golden target ring
 */
export function getVividAircraftColor(
  altFt: number | null,
  onGround: boolean,
  squawk: string | null,
  isSelected: boolean
): string {
  if (isSelected) {
    return "#ffffff"; // Pure White on Gold
  }
  if (squawk === "7700" || squawk === "7600" || squawk === "7500") {
    return "#ff1744"; // Vivid Emergency Red
  }
  if (onGround) {
    return "#ff8800"; // Ground Orange
  }
  if (altFt === null || altFt < 10000) {
    return "#00ff88"; // Vivid Emerald Green
  }
  if (altFt <= 25000) {
    return "#00e5ff"; // Sky Cyan
  }
  if (altFt <= 38000) {
    return "#ffcc00"; // Golden Amber
  }
  return "#e040fb"; // Electric Magenta
}

function createMarkerHtml(aircraft: Aircraft, isSelected: boolean): string {
  const heading = aircraft.trueTrack ?? 0;
  const color = getVividAircraftColor(
    aircraft.baroAltitudeFt,
    aircraft.onGround,
    aircraft.squawk,
    isSelected
  );
  const isEmergency = aircraft.squawk === "7700";
  const isStale = aircraft.isStale;

  return `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 28px; height: 28px; opacity: ${isStale ? 0.45 : 1};">
      ${
        isSelected
          ? `<div class="absolute -inset-2 rounded-full border-2 border-[#ffcc00] shadow-[0_0_10px_rgba(255,204,0,0.8)] pointer-events-none animate-pulse"></div>
             <div class="absolute left-7 top-0 bg-[#0d1624] border border-[#ffcc00] text-[11px] font-mono font-bold text-[#ffcc00] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
               ${aircraft.callsign}
             </div>`
          : ""
      }
      ${
        isEmergency
          ? `<div class="absolute -inset-2 rounded-full border-2 border-[#ff1744] animate-ping pointer-events-none"></div>`
          : ""
      }
      <div 
        class="aircraft-icon-wrapper" 
        style="transform: rotate(${heading}deg); width: 22px; height: 22px;"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}" stroke="#070c14" stroke-width="1.2">
          <!-- Top-Down Airplane Silhouette -->
          <path d="M12 2c-.6 0-1 .4-1 1v6.5L3.5 14v2l7.5-2.5v5l-2 1.5V22l3-1 3 1v-2l-2-1.5v-5l7.5 2.5v-2L13 9.5V3c0-.6-.4-1-1-1z" />
        </svg>
      </div>
    </div>
  `;
}

export default function AircraftMarkerLayer({ map }: Props) {
  const { aircraftMap, selectedIcao24, filters, setSelectedAircraft } = useAirspaceStore();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Dynamic Viewport Culling
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(() => {
    try {
      return map.getBounds().pad(0.25);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleMove = () => {
      try {
        setViewportBounds(map.getBounds().pad(0.25));
      } catch {}
    };

    map.on("moveend zoomend resize", handleMove);
    return () => {
      map.off("moveend zoomend resize", handleMove);
    };
  }, [map]);

  useEffect(() => {
    const existingMarkers = markersRef.current;
    const currentIcaos = new Set<string>();

    const aircraftList = Object.values(aircraftMap).filter((ac) => {
      const lat = ac.deadReckonedLat ?? ac.latitude;
      const lon = ac.deadReckonedLon ?? ac.longitude;
      if (lat === null || lon === null) return false;

      // Viewport culling (always render selected aircraft)
      if (viewportBounds && ac.icao24 !== selectedIcao24) {
        if (!viewportBounds.contains([lat, lon])) {
          return false;
        }
      }

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
      if (
        filters.emergencyOnly &&
        ac.squawk !== "7700" &&
        ac.squawk !== "7600" &&
        ac.squawk !== "7500"
      ) {
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
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      let marker = existingMarkers.get(icao);
      if (!marker) {
        marker = L.marker([lat, lon], {
          icon,
          zIndexOffset: isSelected ? 1000 : 50,
        });

        // Hover tooltip with altitude color pill
        const altColor = getVividAircraftColor(
          ac.baroAltitudeFt,
          ac.onGround,
          ac.squawk,
          false
        );

        const tooltipContent = `
          <div style="font-size: 11px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: 700; color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span>${ac.callsign}</span>
              <span style="font-size: 9px; color: ${altColor}; font-weight: bold; font-family: var(--font-data);">
                ${ac.onGround ? "GROUND" : `${ac.baroAltitudeFt?.toLocaleString() ?? "---"} FT`}
              </span>
            </div>
            <div style="color: #94a3b8; font-size: 10px; font-family: var(--font-data);">
              ${ac.originCountry} • ${ac.velocityKts ?? "---"} kts • ${ac.trueTrack ?? "---"}&deg;
            </div>
            ${ac.squawk ? `<div style="font-size: 9px; color: #ffcc00; font-family: var(--font-data);">Squawk ${ac.squawk}</div>` : ""}
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: "top",
          offset: [0, -12],
          className: "atc-tooltip",
        });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedAircraft(icao);
        });

        marker.addTo(map);
        existingMarkers.set(icao, marker);
      } else {
        marker.setLatLng([lat, lon]);
        marker.setIcon(icon);
        marker.setZIndexOffset(isSelected ? 1000 : 50);
      }
    }

    // Prune markers no longer in viewport or no longer active
    existingMarkers.forEach((marker, icao) => {
      if (!currentIcaos.has(icao)) {
        marker.remove();
        existingMarkers.delete(icao);
      }
    });
  }, [aircraftMap, selectedIcao24, filters, map, setSelectedAircraft, viewportBounds]);

  useEffect(() => {
    const currentMarkers = markersRef.current;
    return () => {
      currentMarkers.forEach((m) => m.remove());
      currentMarkers.clear();
    };
  }, []);

  return null;
}
