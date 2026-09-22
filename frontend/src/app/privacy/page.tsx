"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

export default function PrivacyPage() {
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
              <Shield className="h-5.5 w-5.5 text-brand-primary" />
              Privacy Policy
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
              <Eye className="h-4 w-4 text-brand-primary" />
              1. Information We Collect
            </h2>
            <p>
              We collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Account Information:</strong> When you register on {APP_NAME}, we collect your phone number. When you update your profile, we may collect your name and email address.
              </li>
              <li>
                <strong>Location Data:</strong> To connect you with hyperlocal vendors, we request access to your live location (coordinates) or your saved addresses/pincodes.
              </li>
              <li>
                <strong>Booking & Messages:</strong> We store details of bookings you make and the chat conversations between you and vendors.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Lock className="h-4 w-4 text-success" />
              2. How We Use Information
            </h2>
            <p>
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To offer search results based on geographic radius and distance filter.</li>
              <li>To enable secure sign-in via OTP verification.</li>
              <li>To coordinate bookings, bookings status changes, and in-app communications.</li>
              <li>To contact emergency services or custom emergency contacts when you trigger the SOS button.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" />
              3. Information Security
            </h2>
            <p>
              We work hard to protect {APP_NAME} and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold. We encrypt data transfer and restrict access to personal data to only team members who need it to operate the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-accent" />
              4. Contact Us
            </h2>
            <p>
              If you have any questions or concerns regarding our Privacy Policy or data handling practices, please contact us at support@neighborlink.in or via our helpline.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
