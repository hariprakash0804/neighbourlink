"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  FileText,
  Clock,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Upload,
  AlertCircle,
  Compass,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { VENDOR_CATEGORY_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Map } from "@/components/map/Map";
import { useSession } from "next-auth/react";

export default function VendorRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const businessInputRef = useRef<HTMLInputElement>(null);

  // Steps: 1: Profile, 2: Location, 3: Documents, 4: Pricing/Hours
  const [step, setStep] = useState(1);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Focus business name input when returning to step 1
  useEffect(() => {
    if (step === 1 && businessInputRef.current) {
      businessInputRef.current.focus();
    }
  }, [step]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  
  // Geolocation/Coordinates state
  const [lat, setLat] = useState<number>(12.9716);
  const [lng, setLng] = useState<number>(77.5946);
  const [radius, setRadius] = useState<number>(3000); // meters

  // Document Upload states
  const [docType, setDocType] = useState("Aadhaar");
  const [docFile, setDocFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [shopFile, setShopFile] = useState<{ name: string; base64: string; type: string } | null>(null);

  // Pricing & Hours
  const [priceRate, setPriceRate] = useState<number>(250);
  const [priceUnit, setPriceUnit] = useState("hour");
  const [priceDetails, setPriceDetails] = useState("");
  const [openTime, setOpenTime] = useState("09:00 AM");
  const [closeTime, setCloseTime] = useState("08:00 PM");
  const [upiId, setUpiId] = useState("");

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {
          // Fallback is default Bangalore coords
        }
      );
    }
  }, []);

  // Mutations
  const registerMutation = trpc.vendor.register.useMutation();
  const uploadDocMutation = trpc.vendor.uploadDocument.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "doc" | "shop") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      const fileData = {
        name: file.name,
        type: file.type,
        base64: base64String,
      };
      if (type === "doc") {
        setDocFile(fileData);
      } else {
        setShopFile(fileData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!businessName.trim() || !category) {
        setError("Please enter a business name and select a service category.");
        return;
      }
    }
    if (step === 3) {
      if (!docFile) {
        setError("Please upload an identity proof document.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Submit Registration details
      const regResult = await registerMutation.mutateAsync({
        category,
        businessName,
        description,
        lat,
        lng,
        serviceRadiusM: radius,
        priceInfo: {
          rate: priceRate,
          unit: priceUnit,
          details: priceDetails,
        },
        workingHours: {
          open: openTime,
          close: closeTime,
        },
      });

      const vendorId = regResult.vendorId;

      // 2. Upload verification document if available
      if (docFile && vendorId) {
        await uploadDocMutation.mutateAsync({
          vendorId,
          fileName: docFile.name,
          fileType: docFile.type,
          base64Data: docFile.base64,
        });
      }

      setStep(5); // Success step
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-surface-secondary px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all shadow-sm select-none"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Step Progress indicators */}
      {step < 5 && (
        <div className="mb-8 flex items-center justify-between">
          {[
            { num: 1, label: "Profile", icon: Building2 },
            { num: 2, label: "Area", icon: MapPin },
            { num: 3, label: "Verification", icon: FileText },
            { num: 4, label: "Timing/Price", icon: Clock },
          ].map((s) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all",
                    step === s.num
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/25"
                      : step > s.num
                      ? "bg-success text-white"
                      : "bg-surface-tertiary text-text-muted border border-white/5"
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-semibold mt-1.5",
                    step === s.num ? "text-brand-primary" : "text-text-muted"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {s.num < 4 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 sm:mx-4 transition-all",
                    step > s.num ? "bg-success" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Form Body */}
      <div className="clay-card p-6 md:p-8 relative min-h-[450px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* STEP 1: BUSINESS PROFILE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  Create Vendor Profile
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Tell your neighbors who you are and what services you provide.
                </p>
                {session?.user?.phone && (
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-3 bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 max-w-fit">
                    <Phone className="h-4 w-4 text-brand-primary" />
                    <span>
                      Registering with phone: <span className="font-semibold text-text-primary">{session.user.phone}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Business/Shop Name</label>
                  <input
                    ref={businessInputRef}
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sharma Electrical Repair & Services"
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Service Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                  >
                    <option value="" disabled className="bg-surface-primary text-text-muted">
                      Select a category
                    </option>
                    {VENDOR_CATEGORY_META.map((cat) => (
                      <option
                        key={cat.value}
                        value={cat.value}
                        className="bg-surface-primary text-text-primary"
                      >
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">
                    Description & Specialties
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your services, packages, and skills..."
                    rows={4}
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SERVICE AREA */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  Define Your Service Area
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Adjust the radius slider and position the map marker to set your delivery range.
                </p>
              </div>

              <div className="space-y-4">
                {/* Radius Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-secondary">Service Radius</span>
                    <span className="text-brand-primary">{radius / 1000} km</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={20000}
                    step={500}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-brand-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Map Preview */}
                <div className="h-60 relative w-full">
                  <Map center={[lat, lng]} radiusMeters={radius} />
                  <div className="absolute bottom-4 left-4 z-[999] glass px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary">
                    <Compass className="h-3 w-3 text-brand-primary animate-spin" />
                    <span>Central Point: Bangalore / Chennai</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: DOCUMENT UPLOAD */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  Identity Verification
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  We verify all vendor documentation before activation to ensure community safety.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Government ID Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                  >
                    <option value="Aadhaar" className="bg-surface-primary">Aadhaar Card</option>
                    <option value="PAN" className="bg-surface-primary">PAN Card</option>
                    <option value="VoterID" className="bg-surface-primary">Voter ID</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload card */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 glass hover:bg-white/5 transition-all text-center">
                    <Upload className="h-8 w-8 text-text-muted mb-2.5" />
                    <p className="text-xs font-bold text-text-secondary">Upload ID Document</p>
                    <p className="text-[10px] text-text-muted mt-0.5">JPEG, PNG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "doc")}
                      className="hidden"
                      id="doc-file-input"
                    />
                    <label
                      htmlFor="doc-file-input"
                      className="mt-4 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl cursor-pointer border border-white/5 transition-colors"
                    >
                      Choose File
                    </label>
                    {docFile && (
                      <p className="text-[10px] text-success font-semibold mt-2.5 truncate max-w-xs">
                        Selected: {docFile.name}
                      </p>
                    )}
                  </div>

                  {/* Shop Photo upload card */}
                  <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 glass hover:bg-white/5 transition-all text-center">
                    <Upload className="h-8 w-8 text-text-muted mb-2.5" />
                    <p className="text-xs font-bold text-text-secondary">Upload Shop Photo (Optional)</p>
                    <p className="text-[10px] text-text-muted mt-0.5">JPEG, PNG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "shop")}
                      className="hidden"
                      id="shop-file-input"
                    />
                    <label
                      htmlFor="shop-file-input"
                      className="mt-4 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl cursor-pointer border border-white/5 transition-colors"
                    >
                      Choose File
                    </label>
                    {shopFile && (
                      <p className="text-[10px] text-success font-semibold mt-2.5 truncate max-w-xs">
                        Selected: {shopFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PRICING & HOURS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  Pricing & Availability
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  Configure your service hours and standard package pricing.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">Rate (₹)</label>
                    <input
                      type="number"
                      value={priceRate}
                      onChange={(e) => setPriceRate(Number(e.target.value))}
                      className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">Per Unit</label>
                    <select
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                    >
                      <option value="hour" className="bg-surface-primary">Hour</option>
                      <option value="month" className="bg-surface-primary">Month</option>
                      <option value="visit" className="bg-surface-primary">Visit</option>
                      <option value="unit" className="bg-surface-primary">Unit / Packet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">Opening Time</label>
                    <input
                      type="text"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                      className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-secondary">Closing Time</label>
                    <input
                      type="text"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      placeholder="e.g. 08:00 PM"
                      className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-text-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">Pricing Details & Inclusions</label>
                  <input
                    type="text"
                    value={priceDetails}
                    onChange={(e) => setPriceDetails(e.target.value)}
                    placeholder="e.g. Visiting charges of ₹150 apply, parts charged extra"
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary">UPI ID for Payments</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okaxis"
                    className="w-full rounded-xl py-3 px-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS SECTION */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-4 py-8"
            >
              <div className="rounded-full bg-success/15 p-4 animate-bounce">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                Application Submitted!
              </h2>
              <p className="text-sm text-text-secondary max-w-md">
                Thank you for registering on **NeighborLink**! Our moderators are currently reviewing your documents. You will receive an SMS and your verified badge as soon as the review completes.
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-xl shadow-lg transition-colors select-none"
              >
                Return Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Wizard Navigation Buttons */}
        {step < 5 && (
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 glass px-5 py-2.5 text-xs font-bold text-text-primary hover:bg-white/5 disabled:opacity-50 select-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-2.5 text-xs font-bold shadow-lg select-none"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent text-white px-6 py-2.5 text-xs font-bold shadow-lg disabled:opacity-50 select-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Profile</span>
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
