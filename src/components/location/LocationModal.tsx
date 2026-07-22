"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Loader2,
  Plus,
  Trash2,
  Search,
  X,
  Home,
  Briefcase,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { RADIUS_OPTIONS } from "@/lib/constants";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet?: (location: {
    lat: number;
    lng: number;
    locality: string;
    pincode: string;
    radiusMeters: number;
  }) => void;
}

const LABEL_PRESETS = [
  { label: "Home", icon: Home },
  { label: "Work", icon: Briefcase },
  { label: "Other", icon: Heart },
];

export function LocationModal({ isOpen, onClose, onLocationSet }: LocationModalProps) {
  const [mode, setMode] = useState<"detect" | "manual" | "saved">("detect");
  const [detectLoading, setDetectLoading] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [radius, setRadius] = useState(1000);
  const [error, setError] = useState("");
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number;
    lng: number;
    locality: string;
    pincode: string;
    displayName: string;
  } | null>(null);

  const savedAddresses = trpc.location.getAddresses.useQuery(undefined, {
    enabled: isOpen,
  });
  const saveAddressMutation = trpc.location.saveAddress.useMutation();
  const deleteAddressMutation = trpc.location.deleteAddress.useMutation();

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode("detect");
        setDetectedLocation(null);
        setManualQuery("");
        setError("");
      }, 300);
    }
  }, [isOpen]);

  const handleDetectLocation = useCallback(async () => {
    setDetectLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setDetectLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode
      const res = await fetch(
        `/api/trpc/location.reverseGeocode?input=${encodeURIComponent(
          JSON.stringify({ lat: latitude, lng: longitude })
        )}`
      );
      const data = await res.json();
      const result = data?.result?.data;

      if (result) {
        setDetectedLocation({
          lat: latitude,
          lng: longitude,
          locality: result.locality,
          pincode: result.pincode,
          displayName: result.displayName,
        });
      }
    } catch (err: unknown) {
      const geoError = err as GeolocationPositionError;
      if (geoError?.code === 1) {
        setError("Location permission denied. Please enable location access or enter manually.");
      } else if (geoError?.code === 3) {
        setError("Location request timed out. Please try again or enter manually.");
      } else {
        setError("Could not detect location. Please enter manually.");
      }
    } finally {
      setDetectLoading(false);
    }
  }, []);

  const handleManualSearch = useCallback(async () => {
    if (!manualQuery.trim()) return;
    setSearchLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/trpc/location.forwardGeocode?input=${encodeURIComponent(
          JSON.stringify({ query: manualQuery })
        )}`
      );
      const data = await res.json();
      const result = data?.result?.data;

      if (result) {
        // Now reverse geocode to get locality/pincode
        const revRes = await fetch(
          `/api/trpc/location.reverseGeocode?input=${encodeURIComponent(
            JSON.stringify({ lat: result.lat, lng: result.lng })
          )}`
        );
        const revData = await revRes.json();
        const revResult = revData?.result?.data;

        setDetectedLocation({
          lat: result.lat,
          lng: result.lng,
          locality: revResult?.locality || "Unknown",
          pincode: revResult?.pincode || "",
          displayName: result.displayName,
        });
      } else {
        setError("Location not found. Try a different pincode or area name.");
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  }, [manualQuery]);

  const handleSaveAndUse = useCallback(async () => {
    if (!detectedLocation) return;

    const label = selectedLabel === "Other" ? customLabel || "Other" : selectedLabel;

    try {
      await saveAddressMutation.mutateAsync({
        label,
        lat: detectedLocation.lat,
        lng: detectedLocation.lng,
        pincode: detectedLocation.pincode || "000000",
        radiusMeters: radius,
      });

      onLocationSet?.({
        lat: detectedLocation.lat,
        lng: detectedLocation.lng,
        locality: detectedLocation.locality,
        pincode: detectedLocation.pincode,
        radiusMeters: radius,
      });

      savedAddresses.refetch();
      onClose();
    } catch {
      setError("Failed to save address. Please try again.");
    }
  }, [detectedLocation, selectedLabel, customLabel, radius, saveAddressMutation, onLocationSet, savedAddresses, onClose]);

  const handleUseSaved = useCallback(
    (addr: { lat: number; lng: number; pincode: string; radiusMeters: number; label: string }) => {
      onLocationSet?.({
        lat: addr.lat,
        lng: addr.lng,
        locality: addr.label,
        pincode: addr.pincode,
        radiusMeters: addr.radiusMeters,
      });
      onClose();
    },
    [onLocationSet, onClose]
  );

  const handleDeleteAddress = useCallback(
    async (addressId: string) => {
      try {
        await deleteAddressMutation.mutateAsync({ addressId });
        savedAddresses.refetch();
      } catch {
        setError("Failed to delete address.");
      }
    },
    [deleteAddressMutation, savedAddresses]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 max-sm:inset-x-0 top-[10%] max-sm:top-auto max-sm:bottom-0 max-sm:max-h-[90vh] max-sm:rounded-b-none z-[101] mx-auto max-w-lg rounded-3xl glass-strong shadow-elevated p-6 max-sm:p-5 overflow-y-auto mobile-sheet-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Set Your Location
                  </h2>
                  <p className="text-xs text-text-muted">We&apos;ll show services near you</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
              >
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 glass rounded-xl mb-5">
              {[
                { id: "detect", label: "Auto Detect", icon: Navigation },
                { id: "manual", label: "Enter Manually", icon: Search },
                { id: "saved", label: "Saved", icon: Heart },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id as typeof mode)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all",
                      mode === tab.id
                        ? "bg-brand-primary text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── AUTO DETECT ──────────────── */}
            {mode === "detect" && (
              <div className="space-y-4">
                {!detectedLocation ? (
                  <button
                    onClick={handleDetectLocation}
                    disabled={detectLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl py-5 glass hover:bg-white/5 transition-all"
                  >
                    {detectLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                    ) : (
                      <Navigation className="h-5 w-5 text-brand-primary" />
                    )}
                    <span className="font-medium">
                      {detectLoading ? "Detecting..." : "Use My Current Location"}
                    </span>
                  </button>
                ) : (
                  <LocationResult
                    location={detectedLocation}
                    radius={radius}
                    setRadius={setRadius}
                    selectedLabel={selectedLabel}
                    setSelectedLabel={setSelectedLabel}
                    customLabel={customLabel}
                    setCustomLabel={setCustomLabel}
                    onSave={handleSaveAndUse}
                    saving={saveAddressMutation.isPending}
                  />
                )}
              </div>
            )}

            {/* ── MANUAL ENTRY ─────────────── */}
            {mode === "manual" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      type="text"
                      value={manualQuery}
                      onChange={(e) => setManualQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                      placeholder="Enter pincode or area name..."
                      className="w-full rounded-xl py-3 pl-10 pr-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    />
                  </div>
                  <button
                    onClick={handleManualSearch}
                    disabled={searchLoading || !manualQuery.trim()}
                    className="flex items-center justify-center rounded-xl px-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-sm font-medium"
                  >
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </button>
                </div>

                {detectedLocation && (
                  <LocationResult
                    location={detectedLocation}
                    radius={radius}
                    setRadius={setRadius}
                    selectedLabel={selectedLabel}
                    setSelectedLabel={setSelectedLabel}
                    customLabel={customLabel}
                    setCustomLabel={setCustomLabel}
                    onSave={handleSaveAndUse}
                    saving={saveAddressMutation.isPending}
                  />
                )}
              </div>
            )}

            {/* ── SAVED ADDRESSES ──────────── */}
            {mode === "saved" && (
              <div className="space-y-3">
                {savedAddresses.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                  </div>
                ) : savedAddresses.data && savedAddresses.data.length > 0 ? (
                  savedAddresses.data.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-center gap-3 rounded-2xl p-4 glass hover:bg-white/5 transition-all group cursor-pointer"
                      onClick={() =>
                        handleUseSaved({
                          lat: addr.lat,
                          lng: addr.lng,
                          pincode: addr.pincode,
                          radiusMeters: addr.radiusMeters,
                          label: addr.label,
                        })
                      }
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 shrink-0">
                        <MapPin className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{addr.label}</p>
                        <p className="text-xs text-text-muted truncate">
                          {addr.pincode} · {addr.radiusMeters >= 1000 ? `${addr.radiusMeters / 1000}km` : `${addr.radiusMeters}m`} radius
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(addr.id);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-danger/10 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                    <p className="text-sm text-text-muted">No saved addresses yet</p>
                    <p className="text-xs text-text-muted mt-1">
                      Detect or enter a location to save it
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-danger text-center"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Location Result Sub-component ────────────────────────────────────────────
function LocationResult({
  location,
  radius,
  setRadius,
  selectedLabel,
  setSelectedLabel,
  customLabel,
  setCustomLabel,
  onSave,
  saving,
}: {
  location: { locality: string; pincode: string; displayName: string };
  radius: number;
  setRadius: (r: number) => void;
  selectedLabel: string;
  setSelectedLabel: (l: string) => void;
  customLabel: string;
  setCustomLabel: (l: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Detected location display */}
      <div className="rounded-2xl p-4 glass">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 shrink-0 mt-0.5">
            <MapPin className="h-4 w-4 text-success" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{location.locality}</p>
            {location.pincode && (
              <p className="text-xs text-text-muted">Pincode: {location.pincode}</p>
            )}
            <p className="text-xs text-text-muted truncate mt-0.5">
              {location.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Label selection */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
          Save as
        </p>
        <div className="flex gap-2">
          {LABEL_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.label}
                onClick={() => setSelectedLabel(preset.label)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-all",
                  selectedLabel === preset.label
                    ? "bg-brand-primary text-white shadow-sm"
                    : "glass text-text-secondary hover:text-text-primary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {preset.label}
              </button>
            );
          })}
        </div>
        {selectedLabel === "Other" && (
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="e.g., Parents' House"
            className="mt-2 w-full rounded-xl py-2.5 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        )}
      </div>

      {/* Radius slider */}
      <div>
        <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
          Neighborhood radius
        </p>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRadius(opt.value)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-medium transition-all",
                radius === opt.value
                  ? "neu-inset text-brand-primary font-bold"
                  : "neu-raised text-text-secondary hover:text-text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span>Save & Use This Location</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
