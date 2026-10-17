"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  onComplete?: () => void;
}

export default function FlightIntroAnimation({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Run strictly once on mount - immune to parent re-renders
    const timer = setTimeout(() => {
      setIsVisible(false);
      onCompleteRef.current?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures timers are never reset by parent renders

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden select-none">
      {/* High-Speed Jet Flying Diagonally Across The Screen */}
      <div className="fly-across-banner absolute flex items-center">
        {/* Engine Contrail */}
        <div className="h-[2px] w-96 bg-gradient-to-r from-transparent via-[#00e5ff]/60 to-[#00ff88] rounded-full filter blur-[0.5px]" />

        {/* Tactical Jet Icon */}
        <div className="relative text-[#00ff88] filter drop-shadow(0 0 10px rgba(0,255,136,0.9))">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="#00ff88"
            className="transform rotate-45"
          >
            <path d="M12 2c-.6 0-1 .4-1 1v6.5L3.5 14v2l7.5-2.5v5l-2 1.5V22l3-1 3 1v-2l-2-1.5v-5l7.5 2.5v-2L13 9.5V3c0-.6-.4-1-1-1z" />
          </svg>
          <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
        </div>
      </div>

      <style jsx>{`
        @keyframes flyAcross {
          0% {
            transform: translate(-30vw, 115vh) rotate(-35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(125vw, -25vh) rotate(-35deg);
            opacity: 0;
          }
        }
        .fly-across-banner {
          animation: flyAcross 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
        }
      `}</style>
    </div>
  );
}
