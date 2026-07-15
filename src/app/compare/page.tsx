"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  Star,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  ShieldAlert,
  X,
  Plus,
  ArrowLeft,
  MessageSquare,
  IndianRupee,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, formatDistance, formatPhone, telLink, whatsappLink } from "@/lib/utils";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const ids = searchParams.get("ids");
    return ids ? ids.split(",").slice(0, 3) : [];
  });

  // Search for vendors to add
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Query selected vendors
  const { data: vendorsData, isLoading } = trpc.directory.searchVendors.useQuery(
    {
      category: "OTHER",
      lat: 12.9716,
      lng: 77.5946,
      radius: 50000,
      query: "",
    },
    { enabled: selectedIds.length > 0 || isSearchOpen }
  );

  const allVendors = vendorsData?.vendors || [];
  const selectedVendors = allVendors.filter((v) => selectedIds.includes(v.id));
  const availableVendors = allVendors.filter(
    (v) =>
      !selectedIds.includes(v.id) &&
      (searchQuery === "" ||
        v.businessName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addVendor = (id: string) => {
    if (selectedIds.length < 3) {
      const newIds = [...selectedIds, id];
      setSelectedIds(newIds);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const removeVendor = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  };

  const comparisonFields = [
    { key: "rating", label: "Rating", icon: Star },
    { key: "distance", label: "Distance", icon: MapPin },
    { key: "price", label: "Price", icon: IndianRupee },
    { key: "hours", label: "Working Hours", icon: Clock },
    { key: "response", label: "Response Time", icon: MessageSquare },
    { key: "verification", label: "Verification", icon: CheckCircle },
  ] as const;

  const getFieldValue = (vendor: (typeof allVendors)[0], key: string) => {
    const price = vendor.priceInfo as Record<string, any> | null;
    const hours = vendor.workingHours as Record<string, any> | null;

    switch (key) {
      case "rating":
        return vendor.ratingCount > 0
          ? `${vendor.ratingAvg}★ (${vendor.ratingCount} reviews)`
          : "No reviews yet";
      case "distance":
        return formatDistance(vendor.distance);
      case "price":
        return price ? `₹${price.rate} / ${price.unit}` : "Not listed";
      case "hours":
        return hours ? `${hours.open} – ${hours.close}` : "Not listed";
      case "response":
        return vendor.responseTimeMin
          ? `~${vendor.responseTimeMin} mins`
          : "Not available";
      case "verification":
        return vendor.verificationTier === "TOP_RATED"
          ? "⭐ Top Rated"
          : vendor.verificationTier === "ID_VERIFIED"
          ? "✅ ID Verified"
          : "⚠️ Unverified";
      default:
        return "—";
    }
  };

  const getBestForField = (key: string): string | null => {
    if (selectedVendors.length < 2) return null;
    let bestId: string | null = null;
    let bestScore = -Infinity;

    selectedVendors.forEach((v) => {
      let score = 0;
      const price = v.priceInfo as Record<string, any> | null;
      switch (key) {
        case "rating":
          score = v.ratingAvg;
          break;
        case "distance":
          score = -v.distance; // Lower is better
          break;
        case "price":
          score = price ? -price.rate : -Infinity; // Lower is better
          break;
        case "response":
          score = v.responseTimeMin ? -v.responseTimeMin : -Infinity;
          break;
        case "verification":
          score =
            v.verificationTier === "TOP_RATED"
              ? 3
              : v.verificationTier === "ID_VERIFIED"
              ? 2
              : 1;
          break;
      }
      if (score > bestScore) {
        bestScore = score;
        bestId = v.id;
      }
    });

    return bestId;
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-text-secondary" />
            </button>
            <div>
              <h1
                className="text-xl font-black tracking-tight flex items-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                <Scale className="h-5 w-5 text-brand-primary" />
                Compare Vendors
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Side-by-side comparison of up to 3 vendors
              </p>
            </div>
          </div>
          {selectedIds.length < 3 && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-brand-primary hover:brightness-110 text-white px-4 py-2.5 text-xs font-bold shadow-md select-none transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {selectedVendors.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-primary/10 border border-brand-primary/20">
              <Scale className="h-10 w-10 text-brand-primary" />
            </div>
            <h3 className="text-lg font-bold">No Vendors Selected</h3>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              Add up to 3 vendors to compare their ratings, prices, response
              times, and more side-by-side.
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-4 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-6 py-3 text-sm font-bold text-white shadow-md hover:brightness-110 transition-all"
            >
              Add First Vendor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              {/* Vendor Headers */}
              <thead>
                <tr>
                  <th className="text-left p-3 w-40">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Comparison
                    </span>
                  </th>
                  {selectedVendors.map((v) => (
                    <th key={v.id} className="p-3 text-center">
                      <div className="clay-card p-4 relative">
                        <button
                          onClick={() => removeVendor(v.id)}
                          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full glass text-text-muted hover:text-danger transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <h3
                          className="text-sm font-bold text-text-primary mb-1"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {v.businessName}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            v.verificationTier === "TOP_RATED"
                              ? "bg-warning/10 text-warning"
                              : v.verificationTier === "ID_VERIFIED"
                              ? "bg-verified-blue/10 text-verified-blue"
                              : "bg-text-muted/10 text-text-muted"
                          )}
                        >
                          {v.verificationTier === "TOP_RATED" ? (
                            <>
                              <Star className="h-2.5 w-2.5 fill-warning" />
                              Top Rated
                            </>
                          ) : v.verificationTier === "ID_VERIFIED" ? (
                            <>
                              <CheckCircle className="h-2.5 w-2.5" />
                              Verified
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-2.5 w-2.5" />
                              Unverified
                            </>
                          )}
                        </span>
                      </div>
                    </th>
                  ))}
                  {selectedIds.length < 3 && (
                    <th className="p-3 text-center">
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        className="w-full h-24 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-brand-primary/30 hover:text-brand-primary transition-all"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-semibold">Add</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody>
                {comparisonFields.map((field) => {
                  const Icon = field.icon;
                  const bestId = getBestForField(field.key);

                  return (
                    <tr
                      key={field.key}
                      className="border-t border-white/5"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-text-muted" />
                          <span className="text-xs font-bold text-text-secondary">
                            {field.label}
                          </span>
                        </div>
                      </td>
                      {selectedVendors.map((v) => (
                        <td key={v.id} className="p-3 text-center">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              bestId === v.id
                                ? "text-success font-bold"
                                : "text-text-primary"
                            )}
                          >
                            {getFieldValue(v, field.key)}
                            {bestId === v.id && (
                              <span className="ml-1.5 text-[10px] text-success">
                                ★ Best
                              </span>
                            )}
                          </span>
                        </td>
                      ))}
                      {selectedIds.length < 3 && <td />}
                    </tr>
                  );
                })}

                {/* Action Row */}
                <tr className="border-t border-white/5">
                  <td className="p-3">
                    <span className="text-xs font-bold text-text-muted">
                      Actions
                    </span>
                  </td>
                  {selectedVendors.map((v) => (
                    <td key={v.id} className="p-3 text-center">
                      <div className="flex flex-col gap-2">
                        {v.phone && (
                          <a
                            href={telLink(v.phone)}
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-success/10 py-2 text-xs font-bold text-success hover:bg-success/20 transition-all"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/vendor/${v.id}`)}
                          className="rounded-xl bg-brand-primary/10 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/20 transition-all"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  ))}
                  {selectedIds.length < 3 && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vendor Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="clay-card p-6 border border-white/10 max-w-md w-full max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold">Add Vendor to Compare</h3>
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors by name..."
                className="w-full rounded-xl bg-surface-secondary border border-white/10 px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary/50 mb-3"
                autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin">
                {isLoading ? (
                  <div className="text-center py-8 text-xs text-text-muted">
                    Loading vendors...
                  </div>
                ) : availableVendors.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-muted">
                    No vendors found. Try a different search.
                  </div>
                ) : (
                  availableVendors.slice(0, 20).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => addVendor(v.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-left border border-transparent hover:border-brand-primary/20"
                    >
                      <div>
                        <p className="text-xs font-bold text-text-primary">
                          {v.businessName}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-brand-primary" />
                          {formatDistance(v.distance)} away
                          {v.ratingCount > 0 && (
                            <span className="text-warning">
                              {" "}
                              • {v.ratingAvg}★
                            </span>
                          )}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-brand-primary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface-primary">
          <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
