"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User as UserIcon, Phone, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = "signin" | "signup" | "success";

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"RESIDENT" | "VENDOR">("RESIDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const registerMutation = trpc.auth.register.useMutation();

  // Focus input on open
  useEffect(() => {
    if (isOpen && mode !== "success") {
      setTimeout(() => emailInputRef.current?.focus(), 200);
    }
  }, [isOpen, mode]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode("signin");
        setEmail("");
        setPassword("");
        setName("");
        setPhone("");
        setRole("RESIDENT");
        setError("");
      }, 300);
    }
  }, [isOpen]);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        setMode("success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const registerRes = await registerMutation.mutateAsync({
        email,
        password,
        name,
        phone,
        role,
      });

      if (registerRes.success) {
        // Automatically sign in after successful registration
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.error) {
          setError("Account created, but sign in failed. Please try signing in manually.");
          setMode("signin");
        } else {
          setMode("success");
          setTimeout(() => {
            onSuccess?.();
            onClose();
            if (role === "VENDOR") {
              window.location.href = "/vendor/register";
            }
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-[10%] md:top-[15%] z-[101] mx-auto max-w-md rounded-3xl clay-card border border-white/10 shadow-elevated p-8 text-text-primary"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full glass hover:bg-white/15 transition-all"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>

            <AnimatePresence mode="wait">
              {/* ── MODE: SIGN IN ────────────────────── */}
              {mode === "signin" && (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2
                    className="text-2xl font-black mb-1 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Welcome Back
                  </h2>
                  <p className="text-xs text-text-secondary mb-6">
                    Sign in to connect with neighbors and local services.
                  </p>

                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        ref={emailInputRef}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="Email Address"
                        className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Password"
                        className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-danger font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !email || !password}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold text-white transition-all",
                        email && password
                          ? "bg-gradient-to-r from-brand-primary to-brand-accent shadow-md shadow-brand-primary/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          : "bg-text-muted/20 text-text-muted/60 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-xs text-text-secondary">
                    Don&apos;t have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className="font-bold text-brand-primary hover:underline"
                    >
                      Sign Up
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── MODE: SIGN UP ────────────────────── */}
              {mode === "signup" && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2
                    className="text-2xl font-black mb-1 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Join NeighborLink
                  </h2>
                  <p className="text-xs text-text-secondary mb-5">
                    Create a free account to start booking or listing services.
                  </p>

                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    {/* Role Selection Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-secondary/40 border border-white/5 mb-2">
                      <button
                        type="button"
                        onClick={() => setRole("RESIDENT")}
                        className={cn(
                          "py-2 text-[10px] font-bold rounded-xl transition-all",
                          role === "RESIDENT"
                            ? "bg-brand-primary text-white shadow"
                            : "text-text-muted hover:text-text-secondary"
                        )}
                      >
                        I am a Resident
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("VENDOR")}
                        className={cn(
                          "py-2 text-[10px] font-bold rounded-xl transition-all",
                          role === "VENDOR"
                            ? "bg-brand-primary text-white shadow"
                            : "text-text-muted hover:text-text-secondary"
                        )}
                      >
                        I am a Business/Vendor
                      </button>
                    </div>

                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        ref={emailInputRef}
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                        }}
                        placeholder="Full Name"
                        className="w-full rounded-2xl py-3 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="Email Address"
                        className="w-full rounded-2xl py-3 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 12));
                          setError("");
                        }}
                        placeholder="Phone Number"
                        className="w-full rounded-2xl py-3 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Password (min 6 characters)"
                        className="w-full rounded-2xl py-3 pl-12 pr-4 text-xs text-text-primary glass border border-white/5 focus:outline-none focus:border-brand-primary/50 placeholder:text-text-muted"
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-danger font-medium"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !name || !email || !phone || !password}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold text-white transition-all",
                        name && email && phone && password
                          ? "bg-gradient-to-r from-brand-primary to-brand-accent shadow-md shadow-brand-primary/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          : "bg-text-muted/20 text-text-muted/60 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 text-center text-xs text-text-secondary">
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setMode("signin");
                        setError("");
                      }}
                      className="font-bold text-brand-primary hover:underline"
                    >
                      Sign In
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── MODE: SUCCESS ────────────────────── */}
              {mode === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15 mb-5 border border-success/20 text-success"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <h2
                    className="text-2xl font-black mb-1 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Welcome!
                  </h2>
                  <p className="text-xs text-text-secondary">
                    You have successfully signed in to NeighborLink.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
