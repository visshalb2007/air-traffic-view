"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ATCMap = dynamic(() => import("./ATCMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#0f1216] space-y-2">
      <Loader2 className="w-5 h-5 animate-spin text-[#8b929c]" />
      <span className="text-xs text-[#8b929c]">Loading airspace map...</span>
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
