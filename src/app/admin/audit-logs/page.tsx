"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  List,
  User as UserIcon,
  Shield,
  Clock,
  Sparkles,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch audit logs
  const { data, isLoading } = trpc.admin.auditLogList.useQuery({
    page,
    limit: 20,
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const getActionColor = (action: string) => {
    switch (action) {
      case "APPROVE_VENDOR":
      case "BADGE_TIER_PROMOTION":
        return "text-success bg-success/10 border-success/20";
      case "REJECT_VENDOR":
      case "RESOLVE_REPORT":
        return "text-destructive bg-destructive/10 border-destructive/20";
      case "DISMISS_REPORT":
        return "text-text-secondary bg-white/5 border-white/10";
      default:
        return "text-brand-primary bg-brand-primary/10 border-brand-primary/20";
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-surface-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-primary/10 p-3 border border-brand-primary/20 text-brand-primary">
              <List className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">System Audit Logs</h1>
              <p className="text-xs text-text-secondary mt-1">
                Chronological record of administrative operations, moderation resolutions, and promotions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="clay-card p-12 text-center max-w-md mx-auto space-y-4">
            <div className="rounded-full bg-white/5 p-4 border border-white/10 text-text-secondary w-fit mx-auto">
              <Info className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-text-primary">No Logs Found</h3>
              <p className="text-xs text-text-secondary">
                No system logs or admin actions have been recorded yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Logs List */}
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const isExpanded = expandedLogId === entry.id;
                  return (
                    <div key={entry.id} className="transition-colors hover:bg-white/[0.01]">
                      {/* Log Summary Row */}
                      <div
                        onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Action Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border shrink-0",
                              getActionColor(entry.action)
                            )}
                          >
                            {formatActionName(entry.action)}
                          </span>

                          <div className="min-w-0">
                            <p className="text-xs text-text-secondary truncate">
                              Target ID: <span className="font-mono text-text-primary">{entry.targetId || "—"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-xs text-text-secondary/60">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {new Date(entry.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>

                      {/* Log Detail Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white/[0.02]"
                          >
                            <div className="p-4 border-t border-white/5 text-xs space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                                    Actor
                                  </span>
                                  <p className="text-text-primary flex items-center gap-1">
                                    <UserIcon className="h-3.5 w-3.5 text-brand-primary" />
                                    <span>{entry.actorId}</span>
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                                    Timestamp
                                  </span>
                                  <p className="text-text-primary flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-brand-primary" />
                                    <span>{new Date(entry.createdAt).toLocaleString("en-IN")}</span>
                                  </p>
                                </div>
                              </div>

                              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-text-secondary/60 uppercase font-black">
                                    Event Metadata
                                  </span>
                                  <pre className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-text-secondary leading-relaxed overflow-x-auto select-all">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs text-text-secondary tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
