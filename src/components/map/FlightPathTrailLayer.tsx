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
    // Clear previous polyline & waypoints
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

    const latLngs: L.LatLngExpression[] = [];
    history.forEach((pt) => {
      latLngs.push([pt.lat, pt.lon]);
    });

    if (currentLat !== null && currentLon !== null) {
      latLngs.push([currentLat, currentLon]);
    }

    if (latLngs.length < 2) return;

    // Thin 1.5px operational track line in accent amber
    const polyline = L.polyline(latLngs, {
      color: "#f5a524",
      weight: 1.5,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    polylineRef.current = polyline;

    // Minimal waypoint checkpoints
    history.forEach((pt, index) => {
      const isLast = index === history.length - 1;
      if (isLast) return;

      const timeAgoSecs = Math.max(0, Math.round((Date.now() - pt.timestamp) / 1000));
      const formattedTime = new Date(pt.timestamp).toLocaleTimeString();

      const waypointMarker = L.circleMarker([pt.lat, pt.lon], {
        radius: 2.5,
        color: "#f5a524",
        weight: 1,
        fillColor: "#161a20",
        fillOpacity: 1,
      });

      const tooltipHtml = `
        <div style="font-size: 11px; font-family: var(--font-data);">
          <div style="color: #8b929c;">Point #${index + 1} • ${formattedTime} (${timeAgoSecs}s ago)</div>
          <div style="color: #e6e8eb;">${pt.altitudeFeet?.toLocaleString() ?? "---"} ft • ${pt.velocityKnots ?? "---"} kts • ${pt.heading ?? "---"}&deg;</div>
        </div>
      `;

      waypointMarker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -4],
        className: "atc-tooltip",
      });

      waypointMarker.addTo(map);
      waypointMarkersRef.current.push(waypointMarker);
    });
  }, [aircraftMap, selectedIcao24, showTrails, map]);

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
