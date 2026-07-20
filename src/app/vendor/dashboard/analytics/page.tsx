"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Star,
  Calendar,
  Clock,
  ArrowLeft,
  DollarSign,
  ClipboardCheck,
  Percent,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VendorAnalyticsPage() {
  const router = useRouter();

  // Query analytics endpoint
  const { data, isLoading, error } = trpc.vendor.getAnalytics.useQuery(undefined, {
    retry: false,
  });

  if (error) {
    return (
      <main className="min-h-screen bg-app-bg text-text-primary p-6 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-danger font-semibold">Failed to load analytics dashboard.</p>
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-2 text-sm font-semibold text-white shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </main>
    );
  }

  // Display skeletons while loading
  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-app-bg text-text-primary p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" shape="circle" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </main>
    );
  }

  const { metrics, statusCounts, weeklyTrend, recentReviews } = data;

  // Max value for scaling chart
  const maxWeeklyCount = Math.max(...weeklyTrend.map((t) => t.count), 1);

  return (
    <main className="min-h-screen bg-app-bg text-text-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/vendor/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Analytics Dashboard
              </h1>
              <p className="text-xs text-text-secondary">
                Real-time metrics, booking trends, and feedback insights.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Earnings card */}
          <div className="clay-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/15 border border-success/20 flex items-center justify-center text-success">
              <span className="text-xl font-bold">₹</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">Estimated Earnings</p>
              <p className="text-2xl font-extrabold text-text-primary mt-0.5">
                ₹{metrics.estimatedRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Bookings count */}
          <div className="clay-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">Total Bookings</p>
              <p className="text-2xl font-extrabold text-text-primary mt-0.5">
                {metrics.totalBookings}
              </p>
            </div>
          </div>

          {/* Average Rating */}
          <div className="clay-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/15 border border-warning/20 flex items-center justify-center text-warning">
              <Star className="h-6 w-6 fill-warning" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">Average Rating</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-text-primary">
                  {metrics.ratingAvg || "0.0"}
                </span>
                <span className="text-[10px] text-text-muted">({metrics.ratingCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="clay-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-brand-accent/15 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">Completion Rate</p>
              <p className="text-2xl font-extrabold text-text-primary mt-0.5">
                {metrics.totalBookings > 0
                  ? Math.round((metrics.completedBookings / metrics.totalBookings) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Charts & Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking trends chart (7 days) */}
          <div className="clay-card p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-text-primary">7-Day Booking Volume</h3>
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Live Feed</span>
              </span>
            </div>
            <div className="h-48 flex items-end gap-3 pt-6">
              {weeklyTrend.map((t, idx) => {
                const heightPercentage = Math.round((t.count / maxWeeklyCount) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="relative w-full flex justify-center">
                      {/* Tooltip */}
                      <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-text-primary text-surface-primary text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        {t.count}
                      </span>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${Math.max(heightPercentage, 8)}%` }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-primary to-brand-accent opacity-85 group-hover:opacity-100 transition-opacity"
                    />
                    <span className="text-[10px] text-text-muted mt-2 truncate max-w-full">
                      {t.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="clay-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-text-primary">Appointment Breakdown</h3>
            <div className="space-y-3.5 pt-2">
              {[
                { label: "Completed", count: statusCounts.COMPLETED, color: "bg-success" },
                { label: "Pending Request", count: statusCounts.PENDING, color: "bg-warning" },
                { label: "Accepted / Scheduled", count: statusCounts.ACCEPTED, color: "bg-brand-primary" },
                { label: "Declined", count: statusCounts.DECLINED, color: "bg-text-muted" },
                { label: "Cancelled", count: statusCounts.CANCELLED, color: "bg-danger" },
              ].map((item, idx) => {
                const total = metrics.totalBookings || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary">
                        {item.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className={cn("h-full rounded-full", item.color)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Feedback Feed */}
        <div className="clay-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-text-primary">Recent Resident Reviews</h3>
          {recentReviews.length > 0 ? (
            <div className="divide-y divide-white/5">
              {recentReviews.map((r) => (
                <div key={r.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-text-primary">{r.userName}</p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={cn(
                            "h-3.5 w-3.5",
                            idx < r.rating ? "text-warning fill-warning" : "text-text-muted opacity-30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-tertiary p-3 rounded-xl border border-white/5">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic text-center py-6">No customer reviews yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
