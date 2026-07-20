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
  CheckCircle,
  AlertCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, formatDistance, formatPhone, telLink, shareContent } from "@/lib/utils";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META } from "@/lib/constants";
import { Map } from "@/components/map/Map";
import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useToast } from "@/components/providers/ToastProvider";
import { VendorCard } from "@/components/ui/VendorCard";


function DirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const toast = useToast();
  
  // Auth & Booking states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [bookingVendor, setBookingVendor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const createBooking = trpc.booking.create.useMutation();

  const handleChatClick = (recipientUserId: string) => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
    } else {
      router.push(`/chat?recipientId=${recipientUserId}`);
    }
  };

  const handleBookClick = (vendor: any) => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
    } else {
      setBookingVendor(vendor);
      setBookingSuccess(false);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingVendor || !bookingDate || !bookingTime) return;

    try {
      const slotStart = new Date(`${bookingDate}T${bookingTime}:00`);
      await createBooking.mutateAsync({
        vendorId: bookingVendor.id,
        slotStart: slotStart.toISOString(),
        notes: bookingNotes,
      });
      toast.success("Booking request sent successfully!", "The vendor will review and accept your booking.");
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingVendor(null);
        setBookingSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Failed to submit booking request.");
    }
  };

  // Search parameters
  const activeCategory = searchParams.get("category") || "HOSPITAL";
  const [radius, setRadius] = useState<number>(3000); // Default 3km
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "response">("distance");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Save recently viewed category to localStorage for homepage "Recently Viewed"
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("nl_recent_categories");
      const recent: string[] = stored ? JSON.parse(stored) : [];
      const updated = [activeCategory, ...recent.filter((c) => c !== activeCategory)].slice(0, 5);
      localStorage.setItem("nl_recent_categories", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, [activeCategory]);



  // Favorites
  const toggleFavorite = trpc.favorites.toggle.useMutation();
  const handleToggleFavorite = async (vendorId: string) => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await toggleFavorite.mutateAsync({ vendorId });
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(vendorId)) next.delete(vendorId);
        else next.add(vendorId);
        return next;
      });
      toast.success(favoriteIds.has(vendorId) ? "Removed from favorites" : "Added to favorites!");
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  const handleShare = async (name: string, id: string) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/vendor/${id}`;
    const ok = await shareContent({ title: name, text: `Check out ${name} on NeighborLink`, url });
    if (ok) toast.success("Link copied!");
  };

  // User current location (persist locality / coordinates)
  const [centerLoc, setCenterLoc] = useState<{
    lat: number;
    lng: number;
    locality: string;
  } | null>(null);

  // Load user's default saved address if authenticated
  const { data: addresses } = trpc.location.getAddresses.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      setCenterLoc({
        lat: addresses[0].lat,
        lng: addresses[0].lng,
        locality: addresses[0].label,
      });
    } else {
      setCenterLoc({
        lat: 12.9716,
        lng: 77.5946,
        locality: "Bangalore",
      });
    }
  }, [addresses]);

  // Determine if active category is an Essential Service or local Vendor
  const isEssential = useMemo(() => {
    return ESSENTIAL_CATEGORY_META.some((c) => c.value === activeCategory);
  }, [activeCategory]);

  // Hook 1: Query Essential Services (only if active category is essential)
  const {
    data: essentialData,
    isLoading: essentialLoading,
    error: essentialError,
  } = trpc.directory.searchEssentialServices.useQuery(
    {
      category: activeCategory,
      lat: centerLoc?.lat ?? 12.9716,
      lng: centerLoc?.lng ?? 77.5946,
      radius,
    },
    {
      enabled: !!centerLoc && isEssential,
    }
  );

  // Hook 2: Query Local Vendors (only if active category is vendor)
  const {
    data: vendorData,
    isLoading: vendorLoading,
    error: vendorError,
  } = trpc.directory.searchVendors.useQuery(
    {
      category: activeCategory,
      lat: centerLoc?.lat ?? 12.9716,
      lng: centerLoc?.lng ?? 77.5946,
      radius,
      query: searchQuery,
    },
    {
      enabled: !!centerLoc && !isEssential,
    }
  );

  const isLoading = isEssential ? essentialLoading : vendorLoading;
  const error = isEssential ? essentialError : vendorError;

  // Extract lists
  const services = useMemo(() => essentialData?.services || [], [essentialData?.services]);
  const rawVendors = useMemo(() => vendorData?.vendors || [], [vendorData?.vendors]);

  // Sort vendors
  const vendors = useMemo(() => {
    const sorted = [...rawVendors];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => b.ratingAvg - a.ratingAvg);
        break;
      case "response":
        sorted.sort((a, b) => (a.responseTimeMin || 999) - (b.responseTimeMin || 999));
        break;
      case "distance":
      default:
        sorted.sort((a, b) => a.distance - b.distance);
        break;
    }
    return sorted;
  }, [rawVendors, sortBy]);

  const totalResults = isEssential ? services.length : vendors.length;

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

  // Map markers mapping
  const mapMarkers = useMemo(() => {
    if (isEssential) {
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
    } else {
      return vendors.map((v) => ({
        id: v.id,
        name: v.businessName,
        lat: v.lat,
        lng: v.lng,
        color: activeMeta.color,
        popupContent: (
          <div className="p-1">
            <p className="font-bold text-xs text-text-primary">{v.businessName}</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {formatDistance(v.distance)} away
            </p>
            {v.phone && (
              <a
                href={telLink(v.phone)}
                className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-brand-primary hover:underline"
              >
                <Phone className="h-2.5 w-2.5" />
                <span>Call</span>
              </a>
            )}
          </div>
        ),
      }));
    }
  }, [isEssential, services, vendors, activeMeta]);

  const radiusOptions = [
    { label: "1km", value: 1000 },
    { label: "3km", value: 3000 },
    { label: "5km", value: 5000 },
    { label: "10km", value: 10000 },
    { label: "20km", value: 20000 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-var(--app-nav-height)-28px)] overflow-hidden">
      {/* Emergency Hotbar (Permanently pinned, never behind auth) */}
      <div className="bg-red-950/40 border-b border-red-500/20 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-bold text-red-400 tracking-wide uppercase">Emergency Helplines:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
          <a href="tel:112" className="flex items-center gap-1 hover:text-red-400 transition-colors font-bold">
            🚨 <span>National (112)</span>
          </a>
          <a href="tel:100" className="flex items-center gap-1 hover:text-red-400 transition-colors font-bold">
            🚓 <span>Police (100)</span>
          </a>
          <a href="tel:102" className="flex items-center gap-1 hover:text-red-400 transition-colors font-bold">
            🚑 <span>Ambulance (102)</span>
          </a>
          <a href="tel:101" className="flex items-center gap-1 hover:text-red-400 transition-colors font-bold">
            🔥 <span>Fire (101)</span>
          </a>
        </div>
      </div>

      {/* Search Header Bar */}
      <div className="glass-strong border-b border-white/10 p-4 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0"
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

        {/* Text Fuzzy search box (only for vendors) */}
        {!isEssential && (
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, tags, description..."
              className="w-full rounded-xl py-2 pl-9 pr-4 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
            />
          </div>
        )}

        {/* Radius, Sort & Location */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0 flex-wrap">
          {/* Results count */}
          {!isLoading && (
            <span className="text-[10px] text-text-muted font-medium">
              {totalResults} result{totalResults !== 1 ? "s" : ""} within {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
            </span>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary glass rounded-full px-3.5 py-1.5 border border-white/5 relative group">
            <MapPin className="h-3.5 w-3.5 text-brand-primary" />
            <span>Near {centerLoc?.locality}</span>
            <HelpCircle className="h-3.5 w-3.5 text-text-muted hover:text-text-primary cursor-help transition-colors" />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2.5 bg-surface-primary border border-white/10 rounded-xl text-[10px] font-normal leading-normal text-text-secondary shadow-xl z-50 pointer-events-none">
              Results are filtered based on your address. Update your address in your Profile to search other areas.
            </div>
          </div>

          {/* Sort dropdown (vendors only) */}
          {!isEssential && (
            <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="h-3 w-3 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium text-text-secondary focus:outline-none cursor-pointer"
              >
                <option value="distance">Nearest</option>
                <option value="rating">Top Rated</option>
                <option value="response">Fastest Response</option>
              </select>
            </div>
          )}

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

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Listings */}
        <div
          className={cn(
            "w-full lg:w-1/2 flex flex-col h-full overflow-y-auto scrollbar-thin p-4 space-y-4",
            mobileView === "map" ? "hidden lg:flex" : "flex"
          )}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="clay-card p-5 space-y-3 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="h-4 w-36 rounded-lg bg-surface-tertiary" />
                    <div className="h-4 w-16 rounded-full bg-surface-tertiary" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-3 w-14 rounded bg-surface-tertiary" />
                    <div className="h-3 w-20 rounded bg-surface-tertiary" />
                  </div>
                  <div className="h-3 w-full rounded bg-surface-tertiary" />
                  <div className="h-3 w-3/4 rounded bg-surface-tertiary" />
                  <div className="bg-surface-tertiary/50 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-12 rounded bg-surface-tertiary" />
                      <div className="h-3 w-16 rounded bg-surface-tertiary" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-3 w-10 rounded bg-surface-tertiary" />
                      <div className="h-3 w-20 rounded bg-surface-tertiary" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 rounded-xl bg-surface-tertiary" />
                    <div className="h-8 flex-1 rounded-xl bg-surface-tertiary" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
              <AlertCircle className="h-10 w-10 text-danger mb-3" />
              <h3 className="text-base font-bold">Search Failed</h3>
              <p className="text-xs text-text-secondary mt-1">{error.message}</p>
            </div>
          ) : (isEssential ? services.length === 0 : vendors.length === 0) ? (
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
              {/* ─── ESSENTIAL SERVICE CARDS ─── */}
              {isEssential &&
                services.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 15 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="clay-card card-spotlight p-5 flex flex-col justify-between h-full group"
                  >
                    <div className="space-y-2.5">
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

                      {item.metadata && (
                        <div className="text-xs text-text-secondary bg-surface-tertiary p-2.5 rounded-xl space-y-1">
                          {Object.entries(item.metadata as Record<string, any>).map(
                            ([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-text-muted capitalize">
                                  {key.replace(/([A-Z])/g, " $1")}
                                </span>
                                <span className="font-semibold text-text-primary">
                                  {typeof value === "boolean"
                                    ? value
                                      ? "Yes"
                                      : "No"
                                    : String(value)}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

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

              {/* ─── VENDOR CARDS ─── */}
              {!isEssential &&
                vendors.map((item) => (
                  <VendorCard
                    key={item.id}
                    item={item}
                    isFavorite={favoriteIds.has(item.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onShare={handleShare}
                    onBookClick={handleBookClick}
                    onChatClick={handleChatClick}
                  />
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
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent px-5 py-3 text-sm font-semibold text-white shadow-elevated border border-white/20 select-none"
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

      {/* Auth Modal Trigger Fallback */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Booking Overlay Modal */}
      <AnimatePresence>
        {bookingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="clay-card p-6 w-full max-w-md mx-4 relative overflow-hidden text-text-primary border border-white/10"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-primary to-brand-accent"></div>
              
              {bookingSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="rounded-full bg-success/20 p-4 border border-success/30 text-success">
                    <CheckCircle className="h-12 w-12 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold">Request Sent!</h3>
                  <p className="text-xs text-text-secondary">
                    Your service booking request has been submitted to {bookingVendor.businessName}. They will review it shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Book Service Slot
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Request an appointment with <span className="font-semibold text-brand-primary">{bookingVendor.businessName}</span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        Select Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split("T")[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-xl bg-surface-secondary border border-white/10 px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        Select Preferred Time
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full rounded-xl bg-surface-secondary border border-white/10 px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1">
                        Job Description / Notes
                      </label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Explain the service requirement (e.g. socket repair, water leakage issue)..."
                        rows={3}
                        className="w-full rounded-xl bg-surface-secondary border border-white/10 px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingVendor(null)}
                      className="flex-1 rounded-xl border border-white/10 glass py-2.5 text-xs font-bold text-text-primary hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createBooking.isPending}
                      className="flex-1 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {createBooking.isPending ? "Submitting..." : "Request Booking"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
