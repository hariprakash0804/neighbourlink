"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MessageSquare,
  XCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { VENDOR_CATEGORY_META } from "@/lib/constants";

type TabType = "all" | "PENDING" | "ACCEPTED" | "COMPLETED_DECLINED";

export default function ResidentBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const { data: data, isLoading, refetch } = trpc.booking.listForResident.useQuery();
  const updateBookingStatus = trpc.booking.updateStatus.useMutation();

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      await updateBookingStatus.mutateAsync({
        bookingId,
        status: "CANCELLED",
      });
      refetch();
    } catch (err) {
      console.error("Cancel booking failed:", err);
    }
  };

  const bookings = data?.bookings || [];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true;
    if (activeTab === "PENDING") return b.status === "PENDING";
    if (activeTab === "ACCEPTED") return b.status === "ACCEPTED";
    if (activeTab === "COMPLETED_DECLINED") {
      return ["COMPLETED", "DECLINED", "CANCELLED"].includes(b.status);
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-warning border border-warning/10 select-none animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-warning"></span>
            <span>Pending Response</span>
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success border border-success/10 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
            <span>Accepted / Active</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-verified-blue/15 px-2.5 py-1 text-[11px] font-bold text-verified-blue border border-verified-blue/10 select-none">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case "DECLINED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-bold text-destructive border border-destructive/10 select-none">
            <XCircle className="h-3 w-3" />
            <span>Declined</span>
          </span>
        );
      case "CANCELLED":
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-text-muted/15 px-2.5 py-1 text-[11px] font-bold text-text-muted border border-white/5 select-none">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </span>
        );
    }
  };

  const formatBookingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatBookingTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary px-4 md:px-8 py-10 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-2 mt-12">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>My Dashboard</span>
        </div>
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-text-secondary to-text-muted bg-clip-text text-transparent"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Service Bookings
        </h1>
        <p className="text-sm text-text-secondary max-w-xl">
          Track, cancel, or initiate chats for your upcoming and past home service appointments.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: "all", label: "All Bookings" },
            { id: "PENDING", label: "Pending Requests" },
            { id: "ACCEPTED", label: "Active Jobs" },
            { id: "COMPLETED_DECLINED", label: "Completed & Closed" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 select-none",
              activeTab === t.id
                ? "border-brand-primary text-brand-primary bg-brand-primary/5"
                : "border-transparent text-text-muted hover:text-text-primary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bookings List container */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="clay-card p-5 h-44 animate-shimmer bg-gradient-to-r from-surface-secondary to-surface-tertiary"
            />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="clay-card p-8 text-center max-w-md mx-auto space-y-4">
          <div className="rounded-full bg-brand-primary/10 p-4 border border-brand-primary/20 text-brand-primary w-fit mx-auto">
            <Calendar className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-text-primary">No appointments here</h3>
            <p className="text-xs text-text-secondary">
              We couldn't find any bookings matching this category. Need help around the house?
            </p>
          </div>
          <button
            onClick={() => router.push("/directory?category=ELECTRICIAN")}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 shadow-md transition-all mx-auto"
          >
            <span>Explore Services</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredBookings.map((b) => {
              const categoryMeta = VENDOR_CATEGORY_META.find(
                (c) => c.value === b.vendor?.category
              );
              const Icon = categoryMeta?.icon || HelpCircle;

              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="clay-card p-5 flex flex-col justify-between border border-white/5 relative overflow-hidden group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-brand-primary/10 p-2.5 border border-brand-primary/20 text-brand-primary shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3
                            className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {b.vendor?.businessName || "Local Vendor"}
                          </h3>
                          <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">
                            {categoryMeta?.label || "Service"}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    {/* Schedule block */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary bg-surface-tertiary p-3 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-muted block">Date</span>
                        <span className="font-semibold text-text-primary flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-brand-primary" />
                          <span>{formatBookingDate(b.slotStart)}</span>
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-text-muted block">Time Slot</span>
                        <span className="font-semibold text-text-primary flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-brand-primary" />
                          <span>{formatBookingTime(b.slotStart)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Notes block */}
                    {b.notes && (
                      <div className="text-xs text-text-secondary border border-white/5 bg-surface-secondary/50 p-3 rounded-xl">
                        <span className="text-[10px] text-text-muted block mb-1">Your notes</span>
                        <p className="line-clamp-2 italic">"{b.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="mt-5 pt-3.5 border-t border-white/5 flex gap-2.5">
                    {b.status === "PENDING" && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-bold text-destructive py-2.5 transition-all select-none"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancel Request</span>
                      </button>
                    )}

                    {b.vendor?.userId && (
                      <button
                        onClick={() => router.push(`/chat?recipientId=${b.vendor?.userId}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 text-xs font-bold text-brand-primary py-2.5 transition-all select-none"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat with Vendor</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
