"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  Compass,
  Building2,
  List,
  Map as MapIcon,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, formatDistance, formatPhone, telLink } from "@/lib/utils";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META } from "@/lib/constants";
import { Map } from "@/components/map/Map";
import { useSession } from "next-auth/react";

function DirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search parameters
  const activeCategory = searchParams.get("category") || "HOSPITAL";
  const [radius, setRadius] = useState<number>(3000); // Default 3km
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // User current location (simulated/persisted state, fall back to Bangalore center if not selected)
  // In a real flow, this is read from global state or local storage or the session address
  const [centerLoc, setCenterLoc] = useState<{
    lat: number;
    lng: number;
    locality: string;
  } | null>(null);

  // Load user's default saved address if authenticated
  const { data: session } = useSession();
  const { data: addresses } = trpc.location.getAddresses.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      // Use the first saved address
      setCenterLoc({
        lat: addresses[0].lat,
        lng: addresses[0].lng,
        locality: addresses[0].label,
      });
    } else {
      // Fallback default coordinates (Bangalore center)
      setCenterLoc({
        lat: 12.9716,
        lng: 77.5946,
        locality: "Bangalore",
      });
    }
  }, [addresses]);

  // Query Essential Services
  const { data, isLoading, error } = trpc.directory.searchEssentialServices.useQuery(
    {
      category: activeCategory,
      lat: centerLoc?.lat ?? 12.9716,
      lng: centerLoc?.lng ?? 77.5946,
      radius,
    },
    {
      enabled: !!centerLoc,
    }
  );

  const services = data?.services || [];

  // Metadata for active category
  const activeMeta = useMemo(() => {
    return (
      ESSENTIAL_CATEGORY_META.find((c) => c.value === activeCategory) ||
      VENDOR_CATEGORY_META.find((c) => c.value === activeCategory) || {
        label: activeCategory,
        color: "#6366f1",
        description: "Services in your area",
        icon: Building2,
      }
    );
  }, [activeCategory]);

  const mapMarkers = useMemo(() => {
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      color: activeMeta.color,
      popupContent: (
        <div className="p-1">
          <p className="font-bold text-xs text-text-primary">{s.name}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {formatDistance(s.distance)} away
          </p>
          {s.phone && (
            <a
              href={telLink(s.phone)}
              className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-brand-primary hover:underline"
            >
              <Phone className="h-2.5 w-2.5" />
              <span>Call</span>
            </a>
          )}
        </div>
      ),
    }));
  }, [services, activeMeta]);

  // Radius options helper
  const radiusOptions = [
    { label: "1km", value: 1000 },
    { label: "3km", value: 3000 },
    { label: "5km", value: 5000 },
    { label: "10km", value: 10000 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-var(--app-nav-height)-28px)] overflow-hidden">
      {/* Search Header Bar */}
      <div className="glass-strong border-b border-white/10 p-4 shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${activeMeta.color}15` }}
          >
            <activeMeta.icon className="h-6 w-6" style={{ color: activeMeta.color }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {activeMeta.label}
            </h1>
            <p className="text-xs text-text-muted">{activeMeta.description}</p>
          </div>
        </div>

        {/* Radius selector & Location display */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary glass rounded-full px-3.5 py-1.5 border border-white/5">
            <MapPin className="h-3.5 w-3.5 text-brand-primary" />
            <span>Near {centerLoc?.locality}</span>
          </div>

          <div className="flex gap-1 p-1 glass rounded-xl">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRadius(opt.value)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                  radius === opt.value
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Main Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Listings */}
        <div
          className={cn(
            "w-full lg:w-1/2 flex flex-col h-full overflow-y-auto scrollbar-thin p-4 space-y-4",
            mobileView === "map" ? "hidden lg:flex" : "flex"
          )}
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <LoaderAnimation />
              <p className="text-sm text-text-muted mt-4">Searching nearby services...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
              <AlertCircle className="h-10 w-10 text-danger mb-3" />
              <h3 className="text-base font-bold">Search Failed</h3>
              <p className="text-xs text-text-secondary mt-1">{error.message}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
              <Compass className="h-12 w-12 text-text-muted opacity-30 mb-3" />
              <h3 className="text-base font-bold">No Services Found</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                We couldn&apos;t find any {activeMeta.label.toLowerCase()} within{" "}
                {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`} of your location. Try
                expanding your search radius.
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 },
                },
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {services.map((item) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="clay-card p-5 flex flex-col justify-between h-full group"
                >
                  <div className="space-y-2.5">
                    {/* Header: Title + govt badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors line-clamp-2"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {item.name}
                      </h3>
                      {item.isGovtSource && (
                        <span className="flex items-center gap-0.5 rounded-full bg-verified-blue/10 px-2 py-0.5 text-[10px] font-bold text-verified-blue shrink-0">
                          <CheckCircle className="h-2.5 w-2.5" />
                          <span>Govt</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                        <span>{formatDistance(item.distance)}</span>
                      </span>
                      {item.is24x7 && (
                        <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
                          <span>24x7</span>
                        </span>
                      )}
                    </div>

                    {/* Meta details if available */}
                    {item.metadata && (
                      <div className="text-xs text-text-secondary bg-surface-tertiary p-2.5 rounded-xl space-y-1">
                        {Object.entries(item.metadata as Record<string, any>).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-text-muted capitalize">
                                {key.replace(/([A-Z])/g, " $1")}
                              </span>
                              <span className="font-semibold text-text-primary">
                                {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions / Call details */}
                  <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
                    {item.phone ? (
                      <a
                        href={telLink(item.phone)}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 glass px-4 py-2 text-xs font-semibold text-text-primary hover:bg-white/5 transition-all w-full select-none"
                      >
                        <Phone className="h-3.5 w-3.5 text-success" />
                        <span>{formatPhone(item.phone)}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-text-muted italic py-2">
                        Contact details unavailable
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right Column: Map */}
        <div
          className={cn(
            "w-full lg:w-1/2 h-full p-4 relative",
            mobileView === "list" ? "hidden lg:block" : "block"
          )}
        >
          {centerLoc && (
            <Map
              center={[centerLoc.lat, centerLoc.lng]}
              radiusMeters={radius}
              markers={mapMarkers}
            />
          )}
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setMobileView(mobileView === "list" ? "map" : "list")}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent px-5 py-3 text-sm font-semibold text-white shadow-elevated border border-white/20 select-none animate-bounce"
        >
          {mobileView === "list" ? (
            <>
              <MapIcon className="h-4 w-4" />
              <span>Show Map</span>
            </>
          ) : (
            <>
              <List className="h-4 w-4" />
              <span>Show List</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LoaderAnimation() {
  return (
    <div className="relative flex items-center justify-center h-16 w-16">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary/20 opacity-75"></span>
      <div className="relative rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent p-3.5 shadow-lg">
        <Building2 className="h-8 w-8 text-white animate-pulse" />
      </div>
    </div>
  );
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <LoaderAnimation />
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}
