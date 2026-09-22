"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import LeafletMap with SSR disabled
export const Map = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/10 glass">
      <div className="flex flex-col items-center gap-2 text-text-muted">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="text-xs font-medium">Loading Map...</p>
      </div>
    </div>
  ),
});
