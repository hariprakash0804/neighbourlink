"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ArrowRight, Loader2, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "phone" | "otp" | "success";

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState("");

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const sendOtpMutation = trpc.auth.sendOtp.useMutation();

  // Focus phone input on open
  useEffect(() => {
    if (isOpen && step === "phone") {
      setTimeout(() => phoneInputRef.current?.focus(), 200);
    }
  }, [isOpen, step]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("phone");
        setPhone("");
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setDevOtpHint("");
      }, 300);
    }
  }, [isOpen]);

  const handleSendOtp = useCallback(async () => {
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await sendOtpMutation.mutateAsync({ phone });

      if (result.success) {
        setStep("otp");
        setDevOtpHint(result.message);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 200);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [phone, sendOtpMutation]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        // Handle paste: distribute digits across inputs
        const digits = value.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (index + i < 6) newOtp[index + i] = digit;
        });
        setOtp(newOtp);
        const nextIndex = Math.min(index + digits.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
        return;
      }

      if (!/^\d?$/.test(value)) return;

      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerifyOtp = useCallback(async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Normalize phone
      let normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length === 10) {
        normalizedPhone = `+91${normalizedPhone}`;
      } else if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
      }

      const result = await signIn("phone-otp", {
        phone: normalizedPhone,
        otp: otpString,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        setStep("success");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [otp, phone, onSuccess, onClose]);

  // Auto-submit OTP when all 6 digits are entered (only once, not during loading/error)
  useEffect(() => {
    if (otp.every((d) => d !== "") && step === "otp" && !loading && !error) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-[20%] z-[101] mx-auto max-w-md rounded-3xl glass-strong shadow-elevated p-8"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-text-muted" />
            </button>

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Phone Number ─────────────── */}
              {step === "phone" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 mb-5">
                    <Phone className="h-7 w-7 text-brand-primary" />
                  </div>

                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Welcome to NeighborLink
                  </h2>
                  <p className="text-sm text-text-secondary mb-6">
                    Enter your phone number to sign in or create an account
                  </p>

                  <div className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted font-medium">
                        +91
                      </span>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                          setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        placeholder="Phone number"
                        className="w-full rounded-2xl py-4 pl-14 pr-4 text-base glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
                        maxLength={10}
                      />
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-danger"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      onClick={handleSendOtp}
                      disabled={loading || phone.length < 10}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white transition-all",
                        phone.length >= 10
                          ? "bg-gradient-to-r from-brand-primary to-brand-accent shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                          : "bg-text-muted/30 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Send OTP</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
                    <Shield className="h-3.5 w-3.5 text-success" />
                    <span>Your number is safe. We never share it publicly.</span>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: OTP Verification ─────────── */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 mb-5">
                    <Shield className="h-7 w-7 text-brand-accent" />
                  </div>

                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Verify OTP
                  </h2>
                  <p className="text-sm text-text-secondary mb-1">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-text-primary">
                      +91 {phone}
                    </span>
                  </p>

                  {devOtpHint.includes("dev mode") && (
                    <p className="text-xs text-warning mb-4 glass rounded-lg px-3 py-2 inline-block">
                      🧪 Dev mode — use code: <span className="font-bold">123456</span>
                    </p>
                  )}

                  <div className="space-y-4 mt-4">
                    {/* OTP Input Boxes */}
                    <div className="flex gap-3 justify-center">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
                            handleOtpChange(index, pasted);
                          }}
                          className={cn(
                            "h-14 w-12 rounded-xl text-center text-xl font-bold glass transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/40",
                            digit && "ring-1 ring-brand-primary/30"
                          )}
                          maxLength={1}
                        />
                      ))}
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-danger text-center"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.some((d) => !d)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white transition-all",
                        otp.every((d) => d)
                          ? "bg-gradient-to-r from-brand-primary to-brand-accent shadow-lg shadow-brand-primary/25 hover:shadow-xl"
                          : "bg-text-muted/30 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* Resend / Back */}
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => {
                          setStep("phone");
                          setError("");
                          setOtp(["", "", "", "", "", ""]);
                        }}
                        className="text-text-muted hover:text-text-secondary transition-colors"
                      >
                        ← Change number
                      </button>
                      <button
                        onClick={() => {
                          setOtp(["", "", "", "", "", ""]);
                          setError("");
                          handleSendOtp();
                        }}
                        className="text-brand-primary hover:text-brand-accent transition-colors font-medium"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Success ──────────────────── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                    className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 mb-5"
                  >
                    <CheckCircle2 className="h-10 w-10 text-success" />
                  </motion.div>
                  <h2
                    className="text-xl font-bold mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Welcome!
                  </h2>
                  <p className="text-sm text-text-secondary">
                    You&apos;re now signed in to NeighborLink
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
