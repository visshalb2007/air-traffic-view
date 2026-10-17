"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Aircraft } from "@/types/flight";

interface Props {
  map: L.Map;
}

/**
 * Meaningful altitude-band color ramp (monochromatic / single-hue ramp).
 * Highlight selected in amber (#f5a524) and emergency in muted red (#e05252).
 */
function getAircraftColor(
  altFt: number | null,
  onGround: boolean,
  squawk: string | null,
  isSelected: boolean
): string {
  if (isSelected) {
    return "#f5a524"; // Operational Accent Amber
  }
  if (squawk === "7700" || squawk === "7600" || squawk === "7500") {
    return "#e05252"; // Muted Emergency Red
  }
  if (onGround) {
    return "#555d68"; // Ground
  }
  if (altFt === null || altFt < 10000) {
    return "#8b97a6"; // Low altitude
  }
  if (altFt <= 25000) {
    return "#b5c1d0"; // Mid cruise
  }
  return "#e6e8eb"; // High cruise
}

/**
 * Creates clean operational top-down airplane SVG silhouette
 */
function createMarkerHtml(aircraft: Aircraft, isSelected: boolean): string {
  const heading = aircraft.trueTrack ?? 0;
  const color = getAircraftColor(
    aircraft.baroAltitudeFt,
    aircraft.onGround,
    aircraft.squawk,
    isSelected
  );
  const isStale = aircraft.isStale;

  return `
    <div class="relative flex items-center justify-center cursor-pointer" style="width: 24px; height: 24px; opacity: ${isStale ? 0.35 : 1};">
      ${
        isSelected
          ? `<div class="absolute -inset-1.5 rounded-full border border-[#f5a524] pointer-events-none"></div>
             <div class="absolute left-6 top-0 bg-[#161a20] border border-[#262b33] text-[11px] font-mono text-[#e6e8eb] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-50 pointer-events-none">
               ${aircraft.callsign}
             </div>`
          : ""
      }
      <div 
        class="aircraft-icon-wrapper" 
        style="transform: rotate(${heading}deg); width: 18px; height: 18px;"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${color}">
          <!-- Standard Top-Down Airplane Silhouette -->
          <path d="M12 2c-.6 0-1 .4-1 1v6.5L3.5 14v2l7.5-2.5v5l-2 1.5V22l3-1 3 1v-2l-2-1.5v-5l7.5 2.5v-2L13 9.5V3c0-.6-.4-1-1-1z" />
        </svg>
      </div>
    </div>
  `;
}

export default function AircraftMarkerLayer({ map }: Props) {
  const { aircraftMap, selectedIcao24, filters, setSelectedAircraft } = useAirspaceStore();
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const existingMarkers = markersRef.current;
    const currentIcaos = new Set<string>();

    const aircraftList = Object.values(aircraftMap).filter((ac) => {
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
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      let marker = existingMarkers.get(icao);
      if (!marker) {
        marker = L.marker([lat, lon], {
          icon,
          zIndexOffset: isSelected ? 1000 : 50,
        });

        // Clean, subtle hover tooltip with tabular numeric data
        const tooltipContent = `
          <div style="font-size: 11px; line-height: 1.4;">
            <div style="font-weight: 600; color: #fff;">${ac.callsign} <span style="font-size: 10px; color: #8b929c; font-family: var(--font-data); font-weight: normal;">${ac.icao24.toUpperCase()}</span></div>
            <div style="color: #b5c1d0; font-family: var(--font-data); font-size: 10px;">
              ${ac.onGround ? "On Ground" : `${ac.baroAltitudeFt?.toLocaleString() ?? "---"} ft • ${ac.velocityKts ?? "---"} kts • ${ac.trueTrack ?? "---"}&deg;`}
            </div>
            ${ac.squawk ? `<div style="font-size: 9px; color: #8b929c; font-family: var(--font-data);">Squawk ${ac.squawk}</div>` : ""}
          </div>
        `;

        marker.bindTooltip(tooltipContent, {
          direction: "top",
          offset: [0, -10],
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

    // Prune markers no longer active
    existingMarkers.forEach((marker, icao) => {
      if (!currentIcaos.has(icao)) {
        marker.remove();
        existingMarkers.delete(icao);
      }
    });
  }, [aircraftMap, selectedIcao24, filters, map, setSelectedAircraft]);

  useEffect(() => {
    const currentMarkers = markersRef.current;
    return () => {
      currentMarkers.forEach((m) => m.remove());
      currentMarkers.clear();
    };
  }, []);

  return null;
}
