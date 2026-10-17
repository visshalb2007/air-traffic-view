"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";

export default function AltitudeLegend() {
  const { filters, setFilters } = useAirspaceStore();

  const BANDS = [
    { label: "Ground", color: "#ff8800", filter: () => setFilters({ status: "ground" }) },
    { label: "< 10k ft", color: "#00ff88", filter: () => setFilters({ minAltitudeFt: 0, maxAltitudeFt: 10000, status: "airborne" }) },
    { label: "10k–25k", color: "#00e5ff", filter: () => setFilters({ minAltitudeFt: 10000, maxAltitudeFt: 25000, status: "airborne" }) },
    { label: "25k–38k", color: "#ffcc00", filter: () => setFilters({ minAltitudeFt: 25000, maxAltitudeFt: 38000, status: "airborne" }) },
    { label: "> 38k ft", color: "#e040fb", filter: () => setFilters({ minAltitudeFt: 38000, maxAltitudeFt: 55000, status: "airborne" }) },
    { label: "Emerg 7700", color: "#ff1744", filter: () => setFilters({ emergencyOnly: !filters.emergencyOnly }) },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#14171c]/95 border border-[#262b33] rounded-full shadow-xl backdrop-blur-sm text-[11px] font-mono select-none">
      <span className="text-[#8b929c] mr-1 font-sans text-[10px] uppercase font-bold tracking-wider">
        Altitude:
      </span>
      {BANDS.map((b) => (
        <button
          key={b.label}
          onClick={b.filter}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full hover:bg-[#1f242c] transition-colors text-[#e6e8eb]"
          title={`Filter to ${b.label}`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: b.color }}
          />
          <span className="whitespace-nowrap">{b.label}</span>
        </button>
      ))}
    </div>
  );
}
