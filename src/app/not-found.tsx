"use client";

import { Compass, Home, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-var(--app-nav-height))] flex items-center justify-center p-4 bg-app-bg text-text-primary">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 text-center rounded-2xl glass-strong border border-white/10 shadow-elevated space-y-6"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 animate-bounce">
          <Compass className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            404 — Page Not Found
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all hover:brightness-110 active:scale-98"
          >
            <Home className="h-4 w-4" />
            <span>Go to Homepage</span>
          </Link>
          
          <Link
            href="/directory"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 glass px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-white/5 transition-all active:scale-98"
          >
            <Search className="h-4 w-4 text-brand-primary" />
            <span>Search Directory</span>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
