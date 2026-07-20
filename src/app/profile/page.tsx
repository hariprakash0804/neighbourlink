"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,  
  CheckCircle2,
  ChevronLeft,
  Save,
  Calendar,
  Star,
  Heart,
  MessageSquare,
  Clock,
  MapPin,
  Bell,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Building2,
  Briefcase,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AuthModal } from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { status, update: updateSession } = useSession();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Queries & Mutations
  const { data: profile, isLoading, refetch } = trpc.auth.getProfile.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const { data: addresses, refetch: refetchAddresses } = trpc.location.getAddresses.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      setSaveSuccess(true);
      await refetch();
      // Update next-auth session cache
      await updateSession();
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  const deleteAddressMutation = trpc.location.deleteAddress.useMutation({
    onSuccess: async () => {
      await refetchAddresses();
    },
  });

  // Vendor states
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRate, setPriceRate] = useState<number>(250);
  const [priceUnit, setPriceUnit] = useState("hour");
  const [priceDetails, setPriceDetails] = useState("");
  const [openTime, setOpenTime] = useState("09:00 AM");
  const [closeTime, setCloseTime] = useState("08:00 PM");
  const [vendorSaveSuccess, setVendorSaveSuccess] = useState(false);
  const [vendorError, setVendorError] = useState("");

  // Vendor queries & mutations
  const { data: vendorProfile, isLoading: isVendorLoading, refetch: refetchVendor } = trpc.vendor.getOwnProfile.useQuery(undefined, {
    enabled: status === "authenticated" && profile?.role === "VENDOR",
    retry: false,
  });

  const updateVendorMutation = trpc.vendor.updateProfile.useMutation({
    onSuccess: async () => {
      setVendorSaveSuccess(true);
      await refetchVendor();
      setTimeout(() => setVendorSaveSuccess(false), 2500);
    },
  });

  // Prepopulate vendor fields
  useEffect(() => {
    if (vendorProfile) {
      setBusinessName(vendorProfile.businessName || "");
      setDescription(vendorProfile.description || "");
      if (vendorProfile.priceInfo) {
        const pi = vendorProfile.priceInfo as any;
        setPriceRate(pi.rate || 0);
        setPriceUnit(pi.unit || "hour");
        setPriceDetails(pi.details || "");
      }
      if (vendorProfile.workingHours) {
        const wh = vendorProfile.workingHours as any;
        setOpenTime(wh.open || "09:00 AM");
        setCloseTime(wh.close || "08:00 PM");
      }
    }
  }, [vendorProfile]);

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVendorError("");

    if (!vendorProfile?.id) return;

    if (businessName.trim().length < 2) {
      setVendorError("Business Name must be at least 2 characters long.");
      return;
    }

    try {
      await updateVendorMutation.mutateAsync({
        vendorId: vendorProfile.id,
        businessName: businessName.trim(),
        description: description.trim() || undefined,
        priceInfo: {
          rate: Number(priceRate),
          unit: priceUnit,
          details: priceDetails.trim(),
        },
        workingHours: {
          open: openTime.trim(),
          close: closeTime.trim(),
        },
      });
    } catch (err: any) {
      setVendorError(err.message || "Failed to update business profile.");
    }
  };

  // Prepopulate form fields
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  // Handle unauthenticated state
  useEffect(() => {
    if (status === "unauthenticated") {
      setIsAuthModalOpen(true);
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (name.trim().length < 2) {
      setValidationError("Name must be at least 2 characters long.");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: name.trim(),
        email: email.trim() || undefined,
      });
    } catch (err: any) {
      setValidationError(err.message || "Failed to update profile.");
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-[80vh] bg-surface-primary flex items-center justify-center">
        <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[80vh] bg-surface-primary flex flex-col items-center justify-center p-4">
        <div className="clay-card p-8 text-center max-w-md w-full space-y-4">
          <UserIcon className="h-12 w-12 text-text-muted mx-auto" />
          <h2 className="text-lg font-bold">Please Sign In</h2>
          <p className="text-xs text-text-secondary">
            You must be signed in to view and manage your profile settings.
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white shadow-md hover:brightness-110 transition-all"
          >
            Sign In
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  // Days since joining
  const daysSinceJoining = profile?.createdAt
    ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Get initial for avatar
  const initial = (profile?.name || profile?.phone || "U").charAt(0).toUpperCase();

  // Quick links
  const quickLinks = [
    { label: "My Bookings", href: "/bookings", icon: Calendar, color: "#6366f1" },
    { label: "Saved Vendors", href: "/favorites", icon: Heart, color: "#ef4444" },
    { label: "Chat Inbox", href: "/chat", icon: MessageSquare, color: "#10b981" },
    { label: "Notifications", href: "/notifications", icon: Bell, color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Header with gradient avatar background */}
      <div className="border-b border-white/5 bg-surface-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5" />
        <div className="max-w-xl mx-auto px-4 py-8 relative">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 text-text-secondary transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                <UserIcon className="h-5 w-5 text-brand-primary" />
                Profile Settings
              </h1>
              <p className="text-xs text-text-secondary">
                Update your registration details, name, and notification email.
              </p>
            </div>
          </div>

          {/* Avatar + Name Card */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent text-white text-2xl font-black shadow-lg">
              {initial}
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {profile?.name || "Set your name"}
              </h2>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3" />
                {profile?.phone || "—"}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full border border-brand-primary/20">
                  {profile?.role}
                </span>
                <span className="flex items-center gap-0.5 text-[10px] text-success font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-5">
        {/* Activity Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            {
              icon: Calendar,
              label: "Member Since",
              value: daysSinceJoining > 0 ? `${daysSinceJoining}d` : "Today",
              color: "#6366f1",
            },
            {
              icon: Star,
              label: "Role Status",
              value: profile?.role === "VENDOR" ? "Vendor" : "Resident",
              color: "#f59e0b",
            },
            {
              icon: ShieldCheck,
              label: "Verification",
              value: "Verified",
              color: "#10b981",
            },
            {
              icon: Clock,
              label: "Last Active",
              value: "Now",
              color: "#8b5cf6",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass rounded-2xl p-4 flex items-center gap-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-text-primary">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="clay-card p-4"
        >
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            Quick Links
          </h3>
          <div className="space-y-1">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                    style={{ backgroundColor: `${link.color}15` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: link.color }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary flex-1">
                    {link.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Edit Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="clay-card p-6 md:p-8 space-y-6"
        >
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Edit Profile
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number (Disabled) */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Registered Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  disabled
                  value={profile?.phone || ""}
                  className="w-full rounded-2xl bg-white/5 border border-white/5 py-3 pl-12 pr-4 text-sm text-text-muted cursor-not-allowed"
                />
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-primary" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-red-400 font-medium">{validationError}</p>
            )}

            {updateProfileMutation.error && (
              <p className="text-xs text-red-400 font-medium">
                {updateProfileMutation.error.message}
              </p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-brand-primary py-3.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {updateProfileMutation.isPending ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Success Dialog */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-success/10 border border-success/20 text-success text-xs font-semibold px-4 py-3 rounded-2xl"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Profile updated successfully! Session cached.</span>
            </motion.div>
          )}
        </motion.div>

        {/* Vendor Business Settings Card */}
        {profile?.role === "VENDOR" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            className="clay-card p-6 md:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-4.5 w-4.5 text-brand-primary" />
                Business Settings
              </h3>
              {vendorProfile && (
                <span className="text-[10px] uppercase font-black tracking-wider text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
                  {vendorProfile.verificationTier}
                </span>
              )}
            </div>

            {isVendorLoading ? (
              <div className="flex justify-center py-6">
                <span className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
              </div>
            ) : !vendorProfile ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-xs text-text-secondary">
                  You haven't set up your vendor business details yet. Set up your business profile to start receiving bookings and notifications.
                </p>
                <button
                  onClick={() => router.push("/vendor/register")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <span>Complete Business Setup</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleVendorSubmit} className="space-y-4">
                {/* Business Name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-primary" />
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name..."
                      className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Business Category (Read-only) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Service Category (Domain)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                    <input
                      type="text"
                      disabled
                      value={vendorProfile.category}
                      className="w-full rounded-2xl bg-white/5 border border-white/5 py-3 pl-12 pr-4 text-sm text-text-muted cursor-not-allowed uppercase"
                    />
                  </div>
                </div>

                {/* Business Description */}
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Business Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your services..."
                    className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand-primary/50 transition-all resize-none"
                  />
                </div>

                {/* Pricing Rates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Base Rate (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={priceRate}
                      onChange={(e) => setPriceRate(Number(e.target.value))}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-sm text-text-primary focus:outline-none focus:border-brand-primary/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Pricing Unit</label>
                    <select
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 py-3.5 px-4 text-sm text-text-primary bg-surface-secondary focus:outline-none focus:border-brand-primary/50 transition-all"
                    >
                      <option value="hour">per Hour</option>
                      <option value="day">per Day</option>
                      <option value="month">per Month</option>
                      <option value="service">per Service</option>
                    </select>
                  </div>
                </div>

                {/* Pricing Details */}
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Rate Details (Optional)</label>
                  <input
                    type="text"
                    value={priceDetails}
                    onChange={(e) => setPriceDetails(e.target.value)}
                    placeholder="e.g. includes blue milk packet daily"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-sm text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand-primary/50 transition-all"
                  />
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Opening Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-primary" />
                      <input
                        type="text"
                        required
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        placeholder="09:00 AM"
                        className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">Closing Time</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-primary" />
                      <input
                        type="text"
                        required
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        placeholder="08:00 PM"
                        className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-text-primary focus:outline-none focus:border-brand-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {vendorError && (
                  <p className="text-xs text-red-400 font-medium">{vendorError}</p>
                )}

                {updateVendorMutation.error && (
                  <p className="text-xs text-red-400 font-medium">
                    {updateVendorMutation.error.message}
                  </p>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updateVendorMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-brand-primary py-3.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    {updateVendorMutation.isPending ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Business Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Success Dialog */}
            {vendorSaveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-success/10 border border-success/20 text-success text-xs font-semibold px-4 py-3 rounded-2xl"
              >
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Business details updated successfully!</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Saved Locations */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="clay-card p-6 md:p-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-primary" />
              Saved Locations
            </h3>
            <span className="text-[10px] text-text-secondary/60 bg-white/5 px-2 py-0.5 rounded-full">
              {addresses?.length || 0} Saved
            </span>
          </div>

          <div className="space-y-3">
            {addresses && addresses.length > 0 ? (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={cn(
                    "flex items-center justify-between p-3.5 rounded-2xl transition-all border",
                    "bg-white/5 border-white/5 hover:border-brand-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 shrink-0">
                      <MapPin className="h-4.5 w-4.5 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{addr.label}</p>
                      <p className="text-xs text-text-secondary/80 truncate">
                        Pincode: {addr.pincode} • Radius: {addr.radiusMeters >= 1000 ? `${addr.radiusMeters / 1000}km` : `${addr.radiusMeters}m`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete "${addr.label}"?`)) {
                        try {
                          await deleteAddressMutation.mutateAsync({ addressId: addr.id });
                        } catch (err: any) {
                          window.alert(err.message || "Failed to delete address.");
                        }
                      }
                    }}
                    disabled={deleteAddressMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-danger/10 text-text-secondary hover:text-danger transition-all shrink-0"
                    title="Delete location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
                <MapPin className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-30 animate-pulse" />
                <p className="text-xs text-text-muted font-bold">No saved locations yet.</p>
                <p className="text-[10px] text-text-secondary/50 mt-1 max-w-[220px] mx-auto leading-normal">
                  Use the location selector in the top navigation bar to search and save your neighborhood location.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 border border-danger/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <h3 className="text-xs font-bold text-danger uppercase tracking-wider">Danger Zone</h3>
          </div>
          <p className="text-xs text-text-muted mb-4 leading-relaxed">
            If you wish to delete your account and all associated data, please contact support. This action is irreversible.
          </p>
          <button
            className="rounded-xl border border-danger/20 text-danger text-xs font-bold px-4 py-2.5 hover:bg-danger/5 transition-all"
            onClick={() => {
              // In production, this would open a support ticket or confirmation modal
              window.alert("Please contact support at support@neighborlink.in to request account deletion.");
            }}
          >
            Request Account Deletion
          </button>
        </motion.div>
      </div>
    </div>
  );
}
