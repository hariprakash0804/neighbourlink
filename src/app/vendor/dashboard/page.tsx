"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Phone,
  User,
  Sparkles,
  ClipboardList,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type TabType = "PENDING" | "ACCEPTED" | "HISTORY";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");

  const { data: data, isLoading, error, refetch } = trpc.booking.listForVendor.useQuery({}, {
    retry: false,
  });

  const updateBookingStatus = trpc.booking.updateStatus.useMutation();

  const handleUpdateStatus = async (bookingId: string, status: "ACCEPTED" | "DECLINED" | "COMPLETED") => {
    const actionText = status === "ACCEPTED" ? "accept" : status === "DECLINED" ? "decline" : "complete";
    if (!confirm(`Are you sure you want to ${actionText} this job appointment?`)) return;

    try {
      await updateBookingStatus.mutateAsync({
        bookingId,
        status,
      });
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const isForbidden = error?.shape?.message?.includes("must be registered as a vendor") || error?.shape?.code === -32603;

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-surface-primary text-text-primary flex items-center justify-center px-4">
        <div className="clay-card p-8 text-center max-w-md w-full space-y-6 border border-white/5">
          <div className="rounded-full bg-brand-primary/10 p-5 border border-brand-primary/20 text-brand-primary w-fit mx-auto animate-pulse">
            <ClipboardList className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2
              className="text-2xl font-extrabold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Vendor Dashboard
            </h2>
            <p className="text-sm text-text-secondary">
              You are currently registered as a resident. To receive bookings and messages from neighbors, set up your vendor profile!
            </p>
          </div>
          <button
            onClick={() => router.push("/vendor/register")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent py-3 text-sm font-bold text-white shadow-elevated hover:brightness-110 transition-all"
          >
            <span>Register as a Vendor</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const bookings = data?.bookings || [];

  const pendingJobs = bookings.filter((b) => b.status === "PENDING");
  const activeJobs = bookings.filter((b) => b.status === "ACCEPTED");
  const historyJobs = bookings.filter((b) => ["COMPLETED", "DECLINED", "CANCELLED"].includes(b.status));

  const currentList = activeTab === "PENDING" ? pendingJobs : activeTab === "ACCEPTED" ? activeJobs : historyJobs;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold text-success border border-success/10">
            <span>Completed</span>
          </span>
        );
      case "DECLINED":
        return (
          <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-bold text-destructive border border-destructive/10">
            <span>Declined</span>
          </span>
        );
      case "CANCELLED":
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-text-muted/15 px-2.5 py-1 text-[11px] font-bold text-text-muted border border-white/5">
            <span>Cancelled by Resident</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary px-4 md:px-8 py-10 max-w-5xl mx-auto space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-12">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Business Portal</span>
          </div>
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-text-secondary to-text-muted bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My Job Board
          </h1>
          <p className="text-sm text-text-secondary max-w-xl">
            Manage incoming neighborhood service bookings, view customer details, and update job status.
          </p>
        </div>

        {/* Mini stats cards */}
        <div className="flex gap-3">
          <div className="clay-card px-4 py-3 border border-white/5 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-success" />
            <div>
              <span className="text-[10px] text-text-muted block font-semibold uppercase">Active Jobs</span>
              <span className="text-base font-extrabold">{activeJobs.length}</span>
            </div>
          </div>
          <div className="clay-card px-4 py-3 border border-white/5 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-brand-primary" />
            <div>
              <span className="text-[10px] text-text-muted block font-semibold uppercase">Pending</span>
              <span className="text-base font-extrabold">{pendingJobs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 gap-1.5 overflow-x-auto pb-1">
        {(
          [
            { id: "PENDING", label: `Incoming Requests (${pendingJobs.length})` },
            { id: "ACCEPTED", label: `Active Bookings (${activeJobs.length})` },
            { id: "HISTORY", label: "Job History" },
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

      {/* Booking list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="clay-card p-5 h-44 animate-shimmer bg-gradient-to-r from-surface-secondary to-surface-tertiary"
            />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="clay-card p-8 text-center max-w-md mx-auto space-y-3">
          <div className="rounded-full bg-surface-tertiary p-4 border border-white/5 text-text-muted w-fit mx-auto">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-text-primary">No jobs found</h3>
          <p className="text-xs text-text-secondary">
            You don't have any appointments in this status folder.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {currentList.map((b) => (
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
                  {/* Customer Info header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-brand-primary/10 p-2.5 border border-brand-primary/20 text-brand-primary shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3
                          className="text-sm font-bold text-text-primary"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {b.resident?.name || "Neighbor Customer"}
                        </h3>
                        {b.resident?.phone && (
                          <a
                            href={`tel:${b.resident.phone}`}
                            className="text-xs text-text-secondary hover:text-brand-primary transition-colors flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="h-3 w-3 text-success" />
                            <span>{b.resident.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    {activeTab === "HISTORY" && getStatusBadge(b.status)}
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
                      <span className="text-[10px] text-text-muted block mb-1">Customer notes</span>
                      <p className="line-clamp-2 italic">"{b.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Actions row */}
                <div className="mt-5 pt-3.5 border-t border-white/5 flex gap-2.5">
                  {b.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "DECLINED")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-bold text-destructive py-2.5 transition-all select-none"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Decline</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "ACCEPTED")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all select-none"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Accept Job</span>
                      </button>
                    </>
                  )}

                  {b.status === "ACCEPTED" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-success to-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all select-none"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mark Completed</span>
                      </button>
                      {b.resident?.id && (
                        <button
                          onClick={() => router.push(`/chat?recipientId=${b.resident?.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 text-xs font-bold text-brand-primary py-2.5 transition-all select-none"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat Customer</span>
                        </button>
                      )}
                    </>
                  )}

                  {activeTab === "HISTORY" && b.resident?.id && (
                    <button
                      onClick={() => router.push(`/chat?recipientId=${b.resident?.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 glass hover:bg-white/5 text-xs font-bold text-text-primary py-2.5 transition-all select-none"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Chat Conversation History</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
