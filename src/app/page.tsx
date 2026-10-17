"use client";

import { useState } from "react";
import Navbar from "@/components/dashboard/Navbar";
import SimulationBanner from "@/components/dashboard/SimulationBanner";
import ATCMapContainer from "@/components/map/ATCMapContainer";
import AircraftDrawer from "@/components/dashboard/AircraftDrawer";
import FilterPanel from "@/components/dashboard/FilterPanel";
import FlightRosterTable from "@/components/dashboard/FlightRosterTable";
import AlertsModal from "@/components/dashboard/AlertsModal";
import AltitudeLegend from "@/components/dashboard/AltitudeLegend";
import FlightIntroAnimation from "@/components/animation/FlightIntroAnimation";
import { useFlightPolling } from "@/hooks/useFlightPolling";
import { useDeadReckoningLoop } from "@/hooks/useDeadReckoningLoop";

export default function AirTrafficDashboard() {
  const { manualRefresh } = useFlightPolling();
  useDeadReckoningLoop();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Flight Crossing Screen Intro state
  const [introKey, setIntroKey] = useState(1);
  const [showIntro, setShowIntro] = useState(true);

  const handleReplayIntro = () => {
    sessionStorage.removeItem("skywatch_intro_seen");
    setIntroKey((prev) => prev + 1);
    setShowIntro(true);
  };

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-atc-bg text-atc-text font-sans select-none">
      {/* Flight Crossing Screen Animation Overlay */}
      {showIntro && (
        <FlightIntroAnimation
          key={introKey}
          onComplete={() => setShowIntro(false)}
        />
      )}

      {/* Top Tactical Navigation Bar */}
      <Navbar
        onRefresh={manualRefresh}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
        onToggleTable={() => setIsTableOpen((prev) => !prev)}
        onToggleAlerts={() => setIsAlertsOpen(true)}
        onReplayIntro={handleReplayIntro}
      />

      {/* Offline / Rate-Limit Fallback Banner */}
      <SimulationBanner />

      {/* Main Interactive Map Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <ATCMapContainer />

        {/* Colorful Altitude Spectrum Legend */}
        <AltitudeLegend />

        {/* Selected Aircraft Telemetry Inspector */}
        <AircraftDrawer />

        {/* Filter Drawer */}
        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />

        {/* Flight Roster Table */}
        <FlightRosterTable
          isOpen={isTableOpen}
          onClose={() => setIsTableOpen(false)}
        />

        {/* Tactical Alerts Modal */}
        <AlertsModal
          isOpen={isAlertsOpen}
          onClose={() => setIsAlertsOpen(false)}
        />
      </main>
    </div>
  );
}
