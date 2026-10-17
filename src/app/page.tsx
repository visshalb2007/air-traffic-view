"use client";

import { useState } from "react";
import Navbar from "@/components/dashboard/Navbar";
import SimulationBanner from "@/components/dashboard/SimulationBanner";
import ATCMapContainer from "@/components/map/ATCMapContainer";
import AircraftDrawer from "@/components/dashboard/AircraftDrawer";
import FilterPanel from "@/components/dashboard/FilterPanel";
import FlightRosterTable from "@/components/dashboard/FlightRosterTable";
import AlertsModal from "@/components/dashboard/AlertsModal";
import { useFlightPolling } from "@/hooks/useFlightPolling";
import { useDeadReckoningLoop } from "@/hooks/useDeadReckoningLoop";

export default function AirTrafficDashboard() {
  // Start 10s polling with Page Visibility resilience
  const { manualRefresh } = useFlightPolling();

  // Start 1Hz mathematical dead-reckoning extrapolation
  useDeadReckoningLoop();

  // UI Drawer / Modal states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-radar-bg text-radar-text font-mono select-none">
      {/* Top Tactical Navigation Bar */}
      <Navbar
        onRefresh={manualRefresh}
        onToggleFilters={() => setIsFilterOpen((prev) => !prev)}
        onToggleTable={() => setIsTableOpen((prev) => !prev)}
        onToggleAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Offline / Rate-Limit Fallback Banner */}
      <SimulationBanner />

      {/* Main Interactive Map Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <ATCMapContainer />

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
