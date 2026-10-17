"use client";

import { useState, useMemo } from "react";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { Aircraft } from "@/types/flight";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Plane,
  TableProperties,
  X,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = "callsign" | "altitude" | "velocity" | "track" | "squawk";
type SortDirection = "asc" | "desc";

export default function FlightRosterTable({ isOpen, onClose }: Props) {
  const {
    aircraftMap,
    selectedIcao24,
    filters,
    setSelectedAircraft,
  } = useAirspaceStore();

  const [sortField, setSortField] = useState<SortField>("altitude");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filteredAircraft = useMemo(() => {
    return Object.values(aircraftMap).filter((ac) => {
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

      // Filter: Status
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
  }, [aircraftMap, filters]);

  const sortedAircraft = useMemo(() => {
    return [...filteredAircraft].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortField) {
        case "callsign":
          valA = a.callsign;
          valB = b.callsign;
          return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case "altitude":
          valA = a.baroAltitudeFt ?? -1;
          valB = b.baroAltitudeFt ?? -1;
          break;
        case "velocity":
          valA = a.velocityKts ?? -1;
          valB = b.velocityKts ?? -1;
          break;
        case "track":
          valA = a.trueTrack ?? -1;
          valB = b.trueTrack ?? -1;
          break;
        case "squawk":
          valA = a.squawk ?? "";
          valB = b.squawk ?? "";
          return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDir === "asc" ? valA - valB : valB - valA;
    });
  }, [filteredAircraft, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 max-h-72 bg-radar-card/95 border-t border-radar-border shadow-2xl backdrop-blur-md flex flex-col font-mono text-radar-text animate-in slide-in-from-bottom duration-200">
      {/* Table Header Controls */}
      <div className="px-4 py-2 border-b border-radar-border bg-radar-bg/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-radar-primary" />
          <span className="font-bold text-white tracking-wider">AIRSPACE FLIGHT ROSTER</span>
          <span className="px-2 py-0.5 rounded bg-radar-bg border border-radar-border text-[11px] text-radar-muted font-bold">
            {sortedAircraft.length} AIRCRAFT DISPLAYED
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-radar-bg text-radar-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-radar-bg/90 sticky top-0 border-b border-radar-border text-[10px] uppercase text-radar-muted font-bold">
            <tr>
              <th
                onClick={() => toggleSort("callsign")}
                className="py-2 px-3 cursor-pointer hover:text-radar-primary select-none"
              >
                <div className="flex items-center gap-1">
                  <span>CALLSIGN</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-3">COUNTRY</th>
              <th
                onClick={() => toggleSort("altitude")}
                className="py-2 px-3 cursor-pointer hover:text-radar-primary select-none"
              >
                <div className="flex items-center gap-1">
                  <span>ALTITUDE (FT)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("velocity")}
                className="py-2 px-3 cursor-pointer hover:text-radar-primary select-none"
              >
                <div className="flex items-center gap-1">
                  <span>SPEED (KTS)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("track")}
                className="py-2 px-3 cursor-pointer hover:text-radar-primary select-none"
              >
                <div className="flex items-center gap-1">
                  <span>HEADING</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-3">V.RATE</th>
              <th
                onClick={() => toggleSort("squawk")}
                className="py-2 px-3 cursor-pointer hover:text-radar-primary select-none"
              >
                <div className="flex items-center gap-1">
                  <span>SQUAWK</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2 px-3">STATUS</th>
              <th className="py-2 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-radar-border/40 font-mono">
            {sortedAircraft.map((ac) => {
              const isSelected = selectedIcao24 === ac.icao24;
              const isEmergency = ac.squawk === "7700";

              return (
                <tr
                  key={ac.icao24}
                  onClick={() => setSelectedAircraft(ac.icao24)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-radar-primary/15 font-bold text-white"
                      : isEmergency
                      ? "bg-rose-950/30 text-rose-300 hover:bg-rose-950/50"
                      : "hover:bg-radar-bg/70"
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-radar-primary flex items-center gap-2">
                    <Plane
                      className="w-3.5 h-3.5 shrink-0"
                      style={{
                        transform: `rotate(${ac.trueTrack ?? 0}deg)`,
                      }}
                    />
                    <span>{ac.callsign}</span>
                    <span className="text-[10px] text-radar-muted font-normal uppercase">
                      {ac.icao24}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-radar-muted truncate max-w-[120px]">
                    {ac.originCountry}
                  </td>
                  <td className="py-2 px-3">
                    {ac.baroAltitudeFt !== null ? `${ac.baroAltitudeFt.toLocaleString()} FT` : "---"}
                  </td>
                  <td className="py-2 px-3">
                    {ac.velocityKts !== null ? `${ac.velocityKts} KTS` : "---"}
                  </td>
                  <td className="py-2 px-3">
                    {ac.trueTrack !== null ? `${ac.trueTrack}°` : "---"}
                  </td>
                  <td className="py-2 px-3">
                    {ac.verticalRateFpm !== null
                      ? `${ac.verticalRateFpm > 0 ? "+" : ""}${ac.verticalRateFpm} FPM`
                      : "0"}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isEmergency
                          ? "bg-radar-red text-white animate-pulse"
                          : "bg-radar-bg border border-radar-border text-radar-yellow"
                      }`}
                    >
                      {ac.squawk || "---"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {ac.onGround ? (
                      <span className="text-[10px] text-amber-400 font-semibold">GROUND</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-semibold">AIRBORNE</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAircraft(ac.icao24);
                      }}
                      className="p-1 rounded bg-radar-primary/10 hover:bg-radar-primary/20 text-radar-primary border border-radar-primary/30 text-[10px] inline-flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>TRACK</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
