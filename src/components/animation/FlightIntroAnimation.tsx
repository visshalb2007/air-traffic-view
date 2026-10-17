"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";

interface Props {
  onComplete?: () => void;
}

export default function FlightIntroAnimation({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Quick, snappy flyover: start fade at 1000ms, done at 1300ms
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1000);

    const endTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300 select-none ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Subtle Dark Backdrop that fades out quickly */}
      <div className="absolute inset-0 bg-[#070c14]/90 backdrop-blur-[2px]" />

      {/* High-Speed Jet Flying Across The Screen in 1.1s */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="fly-across-fast absolute flex items-center">
          {/* Contrail trail */}
          <div className="h-[2px] w-96 bg-gradient-to-r from-transparent via-[#00e5ff]/50 to-[#00ff88] rounded-full filter blur-[0.5px]" />
          
          {/* Jet Icon */}
          <div className="relative text-[#00ff88] filter drop-shadow(0 0 10px rgba(0,255,136,0.9))">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="#00ff88"
              className="transform rotate-45"
            >
              <path d="M12 2c-.6 0-1 .4-1 1v6.5L3.5 14v2l7.5-2.5v5l-2 1.5V22l3-1 3 1v-2l-2-1.5v-5l7.5 2.5v-2L13 9.5V3c0-.6-.4-1-1-1z" />
            </svg>
            <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
          </div>
        </div>
      </div>

      {/* Sleek Minimal Center Banner */}
      <div className="relative z-10 text-center space-y-2 px-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-mono tracking-wider uppercase">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>Surveillance Radar Active</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black font-sans tracking-tight text-white">
          SKYWATCH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#00ff88]">ATC</span>
        </h1>
      </div>

      <style jsx>{`
        @keyframes flyAcrossFast {
          0% {
            transform: translate(-25vw, 115vh) rotate(-35deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translate(125vw, -25vh) rotate(-35deg);
            opacity: 0;
          }
        }
        .fly-across-fast {
          animation: flyAcrossFast 1.1s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
        }
      `}</style>
    </div>
  );
}
