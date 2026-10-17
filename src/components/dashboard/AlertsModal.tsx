"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertsModal({ isOpen, onClose }: Props) {
  const {
    alerts,
    unreadAlertCount,
    dismissAlert,
    clearAllAlerts,
    setSelectedAircraft,
  } = useAirspaceStore();

  if (!isOpen) return null;

  const activeAlerts = alerts.filter((a) => !a.isDismissed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
      <div className="w-full max-w-xl bg-[#161a20] border border-[#262b33] rounded shadow-2xl overflow-hidden text-[#e6e8eb] flex flex-col max-h-[80vh] text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#262b33] bg-[#14171c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[#e6e8eb]">Airspace Alerts</span>
            {unreadAlertCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded bg-[#e05252] text-white font-mono text-[10px] font-bold">
                {unreadAlertCount}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {activeAlerts.length > 0 ? (
              <button
                onClick={clearAllAlerts}
                className="text-[11px] text-[#8b929c] hover:text-[#e6e8eb] transition-colors"
              >
                Clear all
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] hover:bg-[#1f242c] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {activeAlerts.length === 0 ? (
            <div className="py-8 text-center text-[#8b929c]">
              No active transponder emergencies or airspace alerts.
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const isCrit = alert.severity === "emergency";
              const timeString = new Date(alert.timestamp).toLocaleTimeString();

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded border flex items-start justify-between gap-3 ${
                    isCrit
                      ? "bg-[#e05252]/10 border-[#e05252]/40"
                      : "bg-[#1f242c]/50 border-[#262b33]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold text-xs ${
                          isCrit ? "text-[#e05252]" : "text-[#f5a524]"
                        }`}
                      >
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-[#8b929c] font-mono">
                        {timeString}
                      </span>
                    </div>
                    <div className="text-xs text-[#c2cedb]">{alert.message}</div>
                    <div className="text-[11px] text-[#8b929c] flex items-center gap-2 pt-0.5 font-mono">
                      <span>Callsign: <strong className="text-[#e6e8eb]">{alert.callsign}</strong></span>
                      <span>•</span>
                      <span>ICAO: <strong className="text-[#e6e8eb] uppercase">{alert.icao24}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedAircraft(alert.icao24);
                        onClose();
                      }}
                      className="px-2 py-1 rounded bg-[#262b33] hover:bg-[#343b46] text-[#e6e8eb] text-[11px] transition-colors font-medium"
                    >
                      Locate
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      title="Dismiss"
                      className="p-1 rounded text-[#8b929c] hover:text-[#e6e8eb] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
