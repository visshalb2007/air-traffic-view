"use client";

import { useState, useEffect } from "react";
import { Plane, Radio, Sparkles } from "lucide-react";

interface Props {
  onComplete?: () => void;
}

export default function FlightIntroAnimation({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check if intro was already shown in this session
    const hasSeenIntro = sessionStorage.getItem("skywatch_intro_seen");
    if (hasSeenIntro) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Start fade-out at 2.6s
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2600);

    // Completely unmount at 3.2s
    const endTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("skywatch_intro_seen", "true");
      onComplete?.();
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-auto bg-[#070c14] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 select-none ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Starfield / Radial Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.15)_0%,rgba(7,12,20,0.95)_70%)]" />

      {/* Decorative Grid Lines */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #00e5ff 1px, transparent 1px), linear-gradient(to bottom, #00e5ff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Animated Flight Crossing The Screen */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Airplane Container traveling diagonally from bottom-left to top-right */}
        <div className="fly-across-screen absolute flex items-center">
          {/* Glowing Engine Contrail */}
          <div className="h-[3px] w-80 bg-gradient-to-r from-transparent via-[#00e5ff]/40 to-[#00ff88] rounded-full filter blur-[1px]" />
          
          {/* Realistic High-Speed Jet Icon */}
          <div className="relative text-[#00ff88] filter drop-shadow(0 0 12px rgba(0,255,136,0.9))">
            <svg
              width="54"
              height="54"
              viewBox="0 0 24 24"
              fill="#00ff88"
              className="transform rotate-45"
            >
              {/* Sleek Top-down Jet Silhouette */}
              <path d="M12 2c-.6 0-1 .4-1 1v6.5L3.5 14v2l7.5-2.5v5l-2 1.5V22l3-1 3 1v-2l-2-1.5v-5l7.5 2.5v-2L13 9.5V3c0-.6-.4-1-1-1z" />
            </svg>
            
            {/* Wingtip strobe flashes */}
            <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
            <div className="absolute bottom-1 right-2 w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
          </div>
        </div>
      </div>

      {/* Cinematic Center Text HUD */}
      <div className="relative z-10 text-center space-y-4 px-6 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-mono tracking-widest uppercase animate-pulse">
          <Radio className="w-3.5 h-3.5" />
          <span>ADS-B Surveillance Active</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-black font-sans tracking-tight text-white drop-shadow-md">
          SKYWATCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#00ff88] to-[#ffcc00]">ATC</span>
        </h1>

        <p className="text-sm font-sans text-[#8b929c] max-w-sm mx-auto">
          Tracking live civil and commercial aviation across global flight corridors
        </p>

        {/* Loading progress bar */}
        <div className="w-56 h-1 bg-[#161a20] rounded-full mx-auto overflow-hidden border border-[#262b33]">
          <div className="h-full bg-gradient-to-r from-[#00e5ff] via-[#00ff88] to-[#f5a524] rounded-full animate-progress" />
        </div>
      </div>

      {/* Skip button in bottom corner */}
      <button
        onClick={() => {
          setIsFading(true);
          setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem("skywatch_intro_seen", "true");
            onComplete?.();
          }, 400);
        }}
        className="absolute bottom-6 right-6 z-20 text-xs font-mono text-[#8b929c] hover:text-white px-3 py-1.5 rounded bg-[#161a20]/80 border border-[#262b33] hover:border-[#4f5968] transition-colors"
      >
        Skip Launch &rarr;
      </button>

      {/* CSS Keyframes for flight crossing screen animation */}
      <style jsx>{`
        @keyframes flyAcross {
          0% {
            transform: translate(-20vw, 110vh) rotate(-35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(120vw, -20vh) rotate(-35deg);
            opacity: 0;
          }
        }
        .fly-across-screen {
          animation: flyAcross 2.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes progressSweep {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progressSweep 2.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
