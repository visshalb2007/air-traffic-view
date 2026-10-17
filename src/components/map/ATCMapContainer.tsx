"use client";

import dynamic from "next/dynamic";
import { Loader2, Radio } from "lucide-react";

// Dynamic import with SSR disabled to prevent Leaflet window reference errors
const ATCMap = dynamic(() => import("./ATCMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-radar-bg space-y-4">
      <div className="relative flex items-center justify-center">
        <Radio className="w-12 h-12 text-radar-primary animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-radar-primary/30 animate-ping" />
      </div>
      <div className="font-mono text-sm tracking-wider text-radar-muted flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-radar-primary" />
        INITIALIZING TACTICAL RADAR MAPPING...
      </div>
    </div>
  ),
});

export default function ATCMapContainer() {
  return (
    <div className="relative h-full w-full">
      <ATCMap />
    </div>
  );
}
