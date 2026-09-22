"use client";

import { motion } from "framer-motion";
import { Scale, FileText, CheckCircle2, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-24 page-enter">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20">
        <div className="max-w-3xl mx-auto px-4 py-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 text-text-secondary transition-all"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1
              className="text-xl font-black tracking-tight flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Scale className="h-5.5 w-5.5 text-brand-primary" />
              Terms of Service
            </h1>
            <p className="text-xs text-text-secondary">
              Last updated: July 15, 2026
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="clay-card p-6 md:p-8 space-y-6 text-sm text-text-secondary leading-relaxed"
        >
          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-primary" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the {APP_NAME} website, API, or services, you agree to be bound by these Terms of Service. If you do not agree to all terms, do not access or use our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              2. User Conduct & Safety Filters
            </h2>
            <p>
              Our platform uses automated safety filters. Any content posted in the Community Hub, Bulletin, Events, reviews, or chat that is flagged for profanity, spam, or abusive language will be rejected. Repeated violations may result in account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Scale className="h-4 w-4 text-warning" />
              3. Vendor Registration & Verification
            </h2>
            <p>
              Vendors registering on {APP_NAME} must provide accurate and truthful details about their services, coverage radius, and contact info. Verification badges are issued at the sole discretion of our administrative review process.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-accent" />
              4. Disclaimer of Warranties
            </h2>
            <p>
              {APP_NAME} provides a platform connecting residents and vendors. We do not employ the vendors and are not responsible for the quality, safety, or legality of services rendered. Bookings are between the resident and the vendor directly.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
