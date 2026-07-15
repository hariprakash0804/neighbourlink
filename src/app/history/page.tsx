"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  Star,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Timer,
  History as HistoryIcon,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, timeAgo } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  PENDING: { bg: "bg-warning/10", text: "text-warning", icon: Timer },
  ACCEPTED: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2 },
  DECLINED: { bg: "bg-danger/10", text: "text-danger", icon: XCircle },
  COMPLETED: { bg: "bg-brand-primary/10", text: "text-brand-primary", icon: CheckCircle2 },
  CANCELLED: { bg: "bg-text-muted/10", text: "text-text-muted", icon: XCircle },
};

function HistoryContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch bookings
  const { data: bookingsData, isLoading: isBookingsLoading } = trpc.booking.listForResident.useQuery(
    undefined,
    { enabled: !!session?.user }
  );

  const bookings = bookingsData?.bookings || [];

  // Group bookings by month
  const groupedByMonth: Record<string, typeof bookings> = {};
  bookings.forEach((b) => {
    const d = new Date(b.createdAt);
    const key = `${d.toLocaleString("en-IN", { month: "long" })} ${d.getFullYear()}`;
    if (!groupedByMonth[key]) groupedByMonth[key] = [];
    groupedByMonth[key].push(b);
  });

  if (status === "unauthenticated") {
    return (
      <div className="min-h-[80vh] bg-surface-primary flex flex-col items-center justify-center p-4">
        <div className="clay-card p-8 text-center max-w-md w-full space-y-4">
          <HistoryIcon className="h-12 w-12 text-text-muted mx-auto" />
          <h2 className="text-lg font-bold">Sign In Required</h2>
          <p className="text-xs text-text-secondary">
            Please sign in to view your service history and activity timeline.
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
      <div className="border-b border-white/5 bg-surface-secondary/20">
        <div className="max-w-2xl mx-auto px-4 py-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 text-text-secondary transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
              <HistoryIcon className="h-5 w-5 text-brand-primary" />
              Service History
            </h1>
            <p className="text-xs text-text-secondary">
              Your complete activity timeline — bookings, statuses, and milestones.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        {isBookingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="clay-card p-5 animate-pulse space-y-3">
                <div className="h-4 w-32 rounded bg-surface-tertiary" />
                <div className="h-3 w-48 rounded bg-surface-tertiary" />
                <div className="h-3 w-24 rounded bg-surface-tertiary" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="rounded-full bg-brand-primary/10 p-5 border border-brand-primary/20 text-brand-primary w-fit mx-auto">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold">No History Yet</h3>
            <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
              Your booking history will appear here once you start using NeighborLink services.
            </p>
            <button
              onClick={() => router.push("/directory")}
              className="rounded-2xl bg-brand-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
            >
              Explore Services
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="timeline-line" />

            {Object.entries(groupedByMonth).map(([month, items]) => (
              <div key={month} className="mb-8">
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4 pl-10">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                    {month}
                  </h2>
                  <span className="text-[10px] text-text-muted">
                    {items.length} booking{items.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Timeline items */}
                <div className="space-y-4">
                  {items.map((booking, idx) => {
                    const statusMeta = STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING;
                    const StatusIcon = statusMeta.icon;

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                        className="relative pl-10"
                      >
                        {/* Dot on timeline */}
                        <div
                          className="timeline-dot"
                          style={{
                            backgroundColor:
                              booking.status === "COMPLETED" ? "var(--color-brand-primary)"
                              : booking.status === "ACCEPTED" ? "var(--color-success)"
                              : booking.status === "DECLINED" || booking.status === "CANCELLED" ? "var(--color-danger)"
                              : "var(--color-warning)",
                          }}
                        />

                        <div className="clay-card p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-brand-accent" />
                                {booking.vendor?.businessName || "Service Booking"}
                              </h3>
                              <p className="text-[10px] text-text-muted mt-0.5">
                                {timeAgo(booking.createdAt as unknown as string)}
                              </p>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1",
                              statusMeta.bg,
                              statusMeta.text,
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {booking.status}
                            </span>
                          </div>

                          {/* Slot time */}
                          <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <Calendar className="h-3 w-3 text-text-muted" />
                            <span>
                              {new Date(booking.slotStart).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {" at "}
                              {new Date(booking.slotStart).toLocaleTimeString("en-IN", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>

                          {/* Notes */}
                          {booking.notes && (
                            <p className="text-xs text-text-muted bg-surface-tertiary/50 rounded-lg px-3 py-2 leading-relaxed">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface-primary">
          <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
