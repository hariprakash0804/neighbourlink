"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  User as UserIcon,
  Flag,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Building,
  Star,
  Layers,
  ChevronRight,
  Inbox,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function AdminModerationPage() {
  const router = useRouter();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // Fetch open reports
  const { data, isLoading, refetch } = trpc.report.listOpen.useQuery();

  // Resolve/Dismiss mutation
  const resolveReport = trpc.report.resolveReport.useMutation({
    onSuccess: () => {
      setSelectedReportId(null);
      refetch();
    },
  });

  const reports = data?.reports || [];

  const handleAction = async (reportId: string, action: "RESOLVE" | "DISMISS") => {
    const confirmation =
      action === "RESOLVE"
        ? "Are you sure you want to RESOLVE this report? This will take moderation actions (e.g. deleting reviews if it is a flagged review) and close the report."
        : "Are you sure you want to DISMISS this report? This will close the report without making changes.";
    
    if (!confirm(confirmation)) return;

    try {
      await resolveReport.mutateAsync({ reportId, action });
    } catch (err) {
      console.error("Failed to perform moderation action:", err);
    }
  };

  const getTargetBadge = (type: string) => {
    switch (type) {
      case "VENDOR":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/20">
            <Building className="h-3 w-3" />
            Vendor Profile
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
            <Star className="h-3 w-3" />
            User Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
            <UserIcon className="h-3 w-3" />
            User Account
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-surface-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 relative">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-surface-secondary px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all shadow-sm select-none mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-destructive/10 p-3 border border-destructive/20 text-destructive">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight leading-tight">Moderation Queue</h1>
                <p className="text-xs text-text-secondary mt-1">
                  Review and resolve user-flagged profiles, reviews, and activities
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => router.push("/admin/vendors")}
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all"
              >
                Vendor Verification
              </button>
              <button
                onClick={() => router.push("/admin/essential")}
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all"
              >
                Essential Services
              </button>
              <button
                onClick={() => router.push("/admin/audit-logs")}
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all"
              >
                Audit Logs
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all"
              >
                Home Feed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
          </div>
        ) : reports.length === 0 ? (
          <div className="clay-card p-12 text-center max-w-md mx-auto space-y-4">
            <div className="rounded-full bg-success/10 p-4 border border-success/20 text-success w-fit mx-auto">
              <Inbox className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-text-primary">Inbox Zero!</h3>
              <p className="text-xs text-text-secondary">
                No open moderation reports or flag requests are currently pending review.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-start">
            {/* Reports List */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 px-1 pb-1">
                <Layers className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Active Reports ({reports.length})
                </h2>
              </div>
              {reports.map((report) => (
                <motion.div
                  key={report.id}
                  layout
                  onClick={() => setSelectedReportId(report.id)}
                  className={cn(
                    "clay-card p-4 border transition-all cursor-pointer text-left relative overflow-hidden group",
                    selectedReportId === report.id
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getTargetBadge(report.targetType)}
                        <span className="text-[10px] text-text-secondary/60 font-mono">
                          ID: {report.targetId.slice(0, 8)}...
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-destructive" />
                        <span>Reported Reason:</span>
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        "{report.reason}"
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-secondary/40 shrink-0 self-center group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-text-secondary/60">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      <span>By: {report.reporter?.name || "Resident"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Details Panel */}
            <div className="md:col-span-1">
              <AnimatePresence mode="wait">
                {selectedReportId ? (
                  (() => {
                    const report = reports.find((r) => r.id === selectedReportId);
                    if (!report) return null;

                    return (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="clay-card p-5 border border-white/5 space-y-5 sticky top-24"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                              <Eye className="h-4 w-4 text-brand-primary" />
                              <span>Report Detail</span>
                            </h2>
                            <button
                              onClick={() => setSelectedReportId(null)}
                              className="text-xs text-text-secondary hover:text-text-primary"
                            >
                              Close
                            </button>
                          </div>
                          <div className="pt-2">
                            {getTargetBadge(report.targetType)}
                          </div>
                        </div>

                        <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="space-y-1">
                            <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                              Target ID
                            </span>
                            <p className="text-xs font-mono select-all truncate text-text-primary">
                              {report.targetId}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                              Reporter info
                            </span>
                            <p className="text-xs text-text-primary">
                              {report.reporter?.name || "Ramesh Kumar"}
                            </p>
                            <p className="text-[10px] font-mono text-text-secondary/60">
                              {report.reporter?.phone || "+919000000001"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                              Filed Date
                            </span>
                            <p className="text-xs text-text-primary flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-brand-primary" />
                              <span>
                                {new Date(report.createdAt).toLocaleString("en-IN")}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] text-text-secondary/60 uppercase font-black flex items-center gap-1">
                            <Flag className="h-3 w-3 text-destructive" />
                            <span>Incident Reason</span>
                          </span>
                          <div className="text-xs text-text-primary border border-destructive/20 bg-destructive/5 p-3.5 rounded-xl leading-relaxed italic">
                            "{report.reason}"
                          </div>
                        </div>

                        {resolveReport.error && (
                          <p className="text-xs text-red-400">{resolveReport.error.message}</p>
                        )}

                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => handleAction(report.id, "RESOLVE")}
                            disabled={resolveReport.isPending}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-destructive to-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
                          >
                            {resolveReport.isPending ? (
                              <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Remove Content / Resolve</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleAction(report.id, "DISMISS")}
                            disabled={resolveReport.isPending}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 glass hover:bg-white/5 py-2.5 text-xs font-bold text-text-primary transition-all"
                          >
                            <XCircle className="h-3.5 w-3.5 text-text-secondary" />
                            <span>Dismiss Report</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()
                ) : (
                  <div className="clay-card p-5 border border-white/5 text-center text-xs text-text-secondary py-16">
                    <AlertTriangle className="h-6 w-6 text-text-secondary/30 mx-auto mb-2" />
                    Select a report from the list to review detailed claim context and take actions.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
