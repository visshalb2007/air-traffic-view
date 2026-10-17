"use client";

import { useState, useMemo } from "react";
import { useAirspaceStore } from "@/store/useAirspaceStore";
import { ArrowUpDown, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = "callsign" | "altitude" | "velocity" | "track" | "squawk";
type SortDirection = "asc" | "desc";

export default function FlightRosterTable({ isOpen, onClose }: Props) {
  const { aircraftMap, selectedIcao24, filters, setSelectedAircraft } = useAirspaceStore();

  const [sortField, setSortField] = useState<SortField>("altitude");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const filteredAircraft = useMemo(() => {
    return Object.values(aircraftMap).filter((ac) => {
      const lat = ac.deadReckonedLat ?? ac.latitude;
      const lon = ac.deadReckonedLon ?? ac.longitude;
      if (lat === null || lon === null) return false;

      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesCallsign = ac.callsign.toLowerCase().includes(query);
        const matchesIcao = ac.icao24.toLowerCase().includes(query);
        const matchesCountry = ac.originCountry.toLowerCase().includes(query);
        if (!matchesCallsign && !matchesIcao && !matchesCountry) return false;
      }

      if (filters.status === "airborne" && ac.onGround) return false;
      if (filters.status === "ground" && !ac.onGround) return false;

      if (
        filters.emergencyOnly &&
        ac.squawk !== "7700" &&
        ac.squawk !== "7600" &&
        ac.squawk !== "7500"
      ) {
        return false;
      }

      const alt = ac.baroAltitudeFt ?? 0;
      if (alt < filters.minAltitudeFt || alt > filters.maxAltitudeFt) return false;

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
    <div className="absolute bottom-0 left-0 right-0 z-20 max-h-72 bg-[#161a20] border-t border-[#262b33] flex flex-col text-xs text-[#e6e8eb] select-none shadow-xl">
      {/* Table Header Controls */}
      <div className="px-4 py-2 border-b border-[#262b33] bg-[#14171c] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-[#e6e8eb]">Airspace Flight Roster</span>
          <span className="text-[11px] text-[#8b929c] font-mono tabular-nums">
            ({sortedAircraft.length} flights)
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Grid */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#14171c] sticky top-0 border-b border-[#262b33] text-[11px] text-[#8b929c] font-medium">
            <tr>
              <th
                onClick={() => toggleSort("callsign")}
                className="py-1.5 px-3 cursor-pointer hover:text-[#e6e8eb]"
              >
                <div className="flex items-center gap-1">
                  <span>Callsign</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-1.5 px-3">ICAO</th>
              <th className="py-1.5 px-3">Country</th>
              <th
                onClick={() => toggleSort("altitude")}
                className="py-1.5 px-3 cursor-pointer hover:text-[#e6e8eb]"
              >
                <div className="flex items-center gap-1">
                  <span>Altitude</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("velocity")}
                className="py-1.5 px-3 cursor-pointer hover:text-[#e6e8eb]"
              >
                <div className="flex items-center gap-1">
                  <span>Speed</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("track")}
                className="py-1.5 px-3 cursor-pointer hover:text-[#e6e8eb]"
              >
                <div className="flex items-center gap-1">
                  <span>Track</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-1.5 px-3">V.Rate</th>
              <th
                onClick={() => toggleSort("squawk")}
                className="py-1.5 px-3 cursor-pointer hover:text-[#e6e8eb]"
              >
                <div className="flex items-center gap-1">
                  <span>Squawk</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-1.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262b33]/60 font-mono text-[11px] tabular-nums">
            {sortedAircraft.map((ac) => {
              const isSelected = selectedIcao24 === ac.icao24;
              const isEmergency = ac.squawk === "7700";

              return (
                <tr
                  key={ac.icao24}
                  onClick={() => setSelectedAircraft(ac.icao24)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#1f242c] text-[#f5a524] font-medium"
                      : isEmergency
                      ? "bg-[#e05252]/10 text-[#e05252]"
                      : "hover:bg-[#1a1f26]"
                  }`}
                >
                  <td className="py-1.5 px-3 font-semibold text-[#e6e8eb]">
                    {ac.callsign}
                  </td>
                  <td className="py-1.5 px-3 uppercase text-[#8b929c]">
                    {ac.icao24}
                  </td>
                  <td className="py-1.5 px-3 font-sans text-[#8b929c] truncate max-w-[120px]">
                    {ac.originCountry}
                  </td>
                  <td className="py-1.5 px-3">
                    {ac.onGround
                      ? "Ground"
                      : ac.baroAltitudeFt !== null
                      ? `${ac.baroAltitudeFt.toLocaleString()} ft`
                      : "---"}
                  </td>
                  <td className="py-1.5 px-3">
                    {ac.velocityKts !== null ? `${ac.velocityKts} kts` : "---"}
                  </td>
                  <td className="py-1.5 px-3">
                    {ac.trueTrack !== null ? `${ac.trueTrack}°` : "---"}
                  </td>
                  <td className="py-1.5 px-3">
                    {ac.verticalRateFpm !== null
                      ? `${ac.verticalRateFpm > 0 ? "+" : ""}${ac.verticalRateFpm}`
                      : "0"}
                  </td>
                  <td className="py-1.5 px-3">
                    <span
                      className={
                        isEmergency ? "text-[#e05252] font-bold" : "text-[#8b929c]"
                      }
                    >
                      {ac.squawk || "---"}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right font-sans text-[10px]">
                    {ac.onGround ? (
                      <span className="text-[#8b929c]">Ground</span>
                    ) : (
                      <span className="text-[#e6e8eb]">Airborne</span>
                    )}
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
