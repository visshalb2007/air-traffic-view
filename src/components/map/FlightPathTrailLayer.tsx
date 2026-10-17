"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAirspaceStore } from "@/store/useAirspaceStore";

interface Props {
  map: L.Map;
}

export default function FlightPathTrailLayer({ map }: Props) {
  const { aircraftMap, selectedIcao24, showTrails } = useAirspaceStore();

  const polylineRef = useRef<L.Polyline | null>(null);
  const waypointMarkersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    // 1. Clear previous polyline & waypoints
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];

    if (!selectedIcao24 || !showTrails) return;

    const aircraft = aircraftMap[selectedIcao24];
    if (!aircraft) return;

    const history = aircraft.history || [];
    const currentLat = aircraft.deadReckonedLat ?? aircraft.latitude;
    const currentLon = aircraft.deadReckonedLon ?? aircraft.longitude;

    // Collect all coordinates along path
    const latLngs: L.LatLngExpression[] = [];

    history.forEach((pt) => {
      latLngs.push([pt.lat, pt.lon]);
    });

    // Add current position to end of path if available
    if (currentLat !== null && currentLon !== null) {
      latLngs.push([currentLat, currentLon]);
    }

    if (latLngs.length < 2) return;

    // Draw glowing flight trail polyline
    const polyline = L.polyline(latLngs, {
      color: "#00e5ff",
      weight: 3,
      opacity: 0.85,
      dashArray: "6, 8",
      lineCap: "round",
    }).addTo(map);

    polylineRef.current = polyline;

    // Render breadcrumb nodes along the historical trail
    history.forEach((pt, index) => {
      const isLast = index === history.length - 1;
      if (isLast) return; // current aircraft marker handles the last point

      const timeAgoSecs = Math.max(0, Math.round((Date.now() - pt.timestamp) / 1000));
      const formattedTime = new Date(pt.timestamp).toLocaleTimeString();

      const waypointMarker = L.circleMarker([pt.lat, pt.lon], {
        radius: 4,
        color: "#00e5ff",
        weight: 1.5,
        fillColor: "#0d1624",
        fillOpacity: 0.9,
      });

      const tooltipHtml = `
        <div class="font-mono text-[11px] p-1 space-y-0.5">
          <div class="font-bold text-radar-primary">WAYPOINT #${index + 1}</div>
          <div class="text-gray-300">TIME: ${formattedTime} (${timeAgoSecs}s ago)</div>
          <div class="text-gray-300">ALT: ${pt.altitudeFeet?.toLocaleString() ?? "---"} FT</div>
          <div class="text-gray-300">SPD: ${pt.velocityKnots ?? "---"} KTS</div>
          <div class="text-gray-300">HDG: ${pt.heading ?? "---"}&deg;</div>
        </div>
      `;

      waypointMarker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -6],
        className: "atc-tactical-tooltip",
      });

      waypointMarker.addTo(map);
      waypointMarkersRef.current.push(waypointMarker);
    });
  }, [aircraftMap, selectedIcao24, showTrails, map]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.remove();
      }
      waypointMarkersRef.current.forEach((m) => m.remove());
    };
  }, []);

  return null;
}
