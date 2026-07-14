"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User as UserIcon, Mail, Phone, ShieldCheck, CheckCircle2, ChevronLeft, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AuthModal } from "@/components/auth/AuthModal";

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
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

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      setSaveSuccess(true);
      await refetch();
      // Update next-auth session cache
      await updateSession();
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

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

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20 relative overflow-hidden">
        <div className="max-w-xl mx-auto px-4 py-8 relative flex items-center gap-3">
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
      </div>

      <div className="max-w-xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="clay-card p-6 md:p-8 space-y-6"
        >
          {/* User Role Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
              Account Role: {profile?.role}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-success font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Account</span>
            </div>
          </div>

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
            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-brand-primary py-3.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
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
      </div>
    </div>
  );
}
