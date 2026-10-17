"use client";

import { useAirspaceStore } from "@/store/useAirspaceStore";
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Crosshair,
  Flame,
  Radio,
  Trash2,
  X,
} from "lucide-react";

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

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "squawk_7700":
        return <Flame className="w-5 h-5 text-radar-red animate-pulse" />;
      case "squawk_7600":
      case "squawk_7500":
        return <Radio className="w-5 h-5 text-radar-red" />;
      case "low_altitude":
      case "rapid_descent":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <AlertOctagon className="w-5 h-5 text-radar-primary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-radar-card border border-radar-border rounded-xl shadow-2xl overflow-hidden font-mono text-radar-text flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-radar-border bg-radar-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/50">
              <Bell className="w-5 h-5 text-radar-red animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-wider">
                  TACTICAL AIRSPACE ALERTS
                </span>
                {unreadAlertCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-radar-red text-white text-[11px] font-bold">
                    {unreadAlertCount} ACTIVE
                  </span>
                )}
              </div>
              <div className="text-xs text-radar-muted">
                Transponder squawk emergencies & flight envelope anomalies
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <button
                onClick={clearAllAlerts}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-radar-bg hover:bg-radar-border text-xs text-radar-muted hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR ALL</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-radar-bg text-radar-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeAlerts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="text-white font-bold text-sm">NO ACTIVE ALERTS DETECTED</div>
              <div className="text-xs text-radar-muted max-w-sm mx-auto">
                All tracked aircraft are operating within normal flight envelopes. Transponders reporting nominal squawks.
              </div>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const isCrit = alert.severity === "emergency";
              const timeString = new Date(alert.timestamp).toLocaleTimeString();

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCrit
                      ? "bg-rose-950/40 border-rose-500/60 shadow-[0_0_12px_rgba(255,42,85,0.15)]"
                      : "bg-amber-950/30 border-amber-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-radar-bg border border-radar-border mt-0.5">
                        {getAlertIcon(alert.type, alert.severity)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black tracking-wider text-xs ${
                              isCrit ? "text-radar-red" : "text-amber-400"
                            }`}
                          >
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-radar-muted font-normal">
                            {timeString}
                          </span>
                        </div>
                        <div className="text-xs text-gray-200">{alert.message}</div>
                        <div className="text-[11px] text-radar-muted flex items-center gap-3 pt-1">
                          <span>
                            CALLSIGN: <strong className="text-white">{alert.callsign}</strong>
                          </span>
                          <span>
                            ICAO: <strong className="text-radar-primary">{alert.icao24.toUpperCase()}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedAircraft(alert.icao24);
                          onClose();
                        }}
                        title="Locate aircraft on map"
                        className="p-2 rounded-lg bg-radar-primary/10 hover:bg-radar-primary/20 border border-radar-primary/40 text-radar-primary transition-colors flex items-center gap-1 text-xs"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">LOCATE</span>
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        title="Dismiss alert"
                        className="p-2 rounded-lg bg-radar-bg hover:bg-radar-border text-radar-muted hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
