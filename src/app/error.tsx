"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Global boundary caught error:", error);
  }, [error]);

  return (
    <main
      className="min-h-[calc(100vh-var(--app-nav-height))] flex items-center justify-center p-4 bg-app-bg text-text-primary"
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 text-center rounded-2xl glass-strong border border-danger/20 shadow-elevated space-y-6"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger border border-danger/20">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Something went wrong
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          {error.message && (
            <div className="p-3 bg-danger/5 rounded-xl border border-danger/10 text-left">
              <p className="font-mono text-xs text-danger break-words">
                {error.message}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all hover:brightness-110 active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 glass px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-white/5 transition-all active:scale-98"
          >
            <Home className="h-4 w-4 text-brand-primary" />
            <span>Go Home</span>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
