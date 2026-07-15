"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Shield, Calendar, ArrowRight, X } from "lucide-react";

const ONBOARDING_SLIDES = [
  {
    icon: MapPin,
    title: "Find Everything Near You",
    description:
      "Enter your location once — discover hospitals, pharmacies, local vendors, and every service your neighborhood offers, all on a live map.",
    gradient: "from-indigo-500 to-violet-600",
    color: "#6366f1",
  },
  {
    icon: Shield,
    title: "Verified & Trusted",
    description:
      "Every vendor is OTP-verified. Top-rated vendors earn trust badges through real reviews. No anonymous listings, no fake data.",
    gradient: "from-emerald-500 to-teal-600",
    color: "#10b981",
  },
  {
    icon: Calendar,
    title: "Book, Chat & Review",
    description:
      "Book service slots directly, chat with vendors in-app, track your appointments, and rate your experience — all without leaving NeighborLink.",
    gradient: "from-violet-500 to-purple-600",
    color: "#8b5cf6",
  },
];

const LS_KEY = "neighborlink-onboarding-seen";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Only show on first visit
    const seen = localStorage.getItem(LS_KEY);
    if (!seen) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(LS_KEY, "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const Icon = slide.icon;
  const isLast = currentSlide === ONBOARDING_SLIDES.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="clay-card w-full max-w-md overflow-hidden relative"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full glass text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close onboarding"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Gradient header */}
            <div
              className={`bg-gradient-to-br ${slide.gradient} p-8 pb-12 text-white text-center relative overflow-hidden`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

              <motion.div
                key={currentSlide}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative z-10"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 border border-white/30 mb-4">
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <h2
                  className="text-xl font-extrabold"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {slide.title}
                </h2>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 pt-6 space-y-6">
              <motion.p
                key={`desc-${currentSlide}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-sm text-text-secondary leading-relaxed text-center"
              >
                {slide.description}
              </motion.p>

              {/* Dots indicator */}
              <div className="flex items-center justify-center gap-2">
                {ONBOARDING_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? "w-6 bg-brand-primary"
                        : "w-2 bg-text-muted/30 hover:bg-text-muted/50"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 rounded-xl border border-white/10 glass py-3 text-xs font-bold text-text-secondary hover:bg-white/5 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent py-3 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                >
                  <span>{isLast ? "Get Started" : "Next"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
