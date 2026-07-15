"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  Eye,
  ClipboardList,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getFileUrl } from "@/lib/storage-client";
import { cn, formatDistance, formatPhone, telLink, timeAgo } from "@/lib/utils";
import { Map } from "@/components/map/Map";

export default function AdminVendorsPage() {
  const router = useRouter();

  // Queries & Mutations
  const { data, isLoading, error, refetch } = trpc.admin.getPendingVendors.useQuery();
  const verifyMutation = trpc.admin.verifyVendor.useMutation();
  const rejectMutation = trpc.admin.rejectVendor.useMutation();

  const pendingList = data?.vendors || [];

  // Moderation state
  const [selectedVendor, setSelectedVendor] = useState<typeof pendingList[number] | null>(null);
  const [rejectingVendor, setRejectingVendor] = useState<typeof pendingList[number] | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [modalDocUrl, setModalDocUrl] = useState<string | null>(null);

  const handleVerify = async (vendorId: string) => {
    if (!confirm("Are you sure you want to verify and activate this vendor?")) return;
    setActionLoading(true);
    try {
      await verifyMutation.mutateAsync({ vendorId });
      alert("Vendor approved successfully!");
      setSelectedVendor(null);
      refetch();
    } catch (err: any) {
      alert(err?.message || "Failed to verify vendor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingVendor) return;
    if (rejectReason.trim().length < 5) {
      alert("Please enter a rejection reason (minimum 5 characters).");
      return;
    }

    setActionLoading(true);
    try {
      await rejectMutation.mutateAsync({
        vendorId: rejectingVendor.id,
        reason: rejectReason,
      });
      alert("Vendor rejected and notified.");
      setRejectingVendor(null);
      setRejectReason("");
      setSelectedVendor(null);
      refetch();
    } catch (err: any) {
      alert(err?.message || "Failed to reject vendor");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between border-b border-white/10 pb-6 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary mb-3">
            <Shield className="h-3.5 w-3.5" /> ADMIN SECURITY PORTAL
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Vendor Moderation Queue
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Review vendor business profiles, service ranges, and verify uploaded documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary glass rounded-xl px-4 py-2 border border-white/5 h-9">
            <ClipboardList className="h-4 w-4 text-brand-primary" />
            <span>Pending Applications: {pendingList.length}</span>
          </div>
          <button
            onClick={() => router.push("/admin/moderation")}
            className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
          >
            Moderation Queue
          </button>
          <button
            onClick={() => router.push("/admin/audit-logs")}
            className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
          >
            Audit Logs
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary transition-all h-9 select-none"
          >
            Home Feed
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-3 max-w-md mx-auto text-center">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold">Access Denied</p>
            <p className="text-xs text-text-muted mt-0.5">{error.message}</p>
          </div>
        </div>
      ) : pendingList.length === 0 ? (
        <div className="clay-card p-12 text-center max-w-md mx-auto">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
          <h3 className="font-bold">Queue is Empty</h3>
          <p className="text-xs text-text-muted mt-1">
            All vendor registrations have been reviewed and moderations resolved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Vendor List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
              Applications
            </h2>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
              {pendingList.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => setSelectedVendor(vendor)}
                  className={cn(
                    "w-full text-left clay-card p-4 transition-all duration-200 select-none",
                    selectedVendor?.id === vendor.id
                      ? "neu-inset border-brand-primary/40"
                      : "hover:scale-[1.01]"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm text-text-primary truncate">
                      {vendor.businessName}
                    </h3>
                    <span className="text-[10px] rounded-full bg-surface-tertiary px-2 py-0.5 text-text-muted border border-white/5 uppercase font-semibold">
                      {vendor.category.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1.5 font-medium">
                    Owner: {vendor.user?.name || "Unspecified"}
                  </p>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-primary/70" />
                      Radius: {formatDistance(vendor.serviceRadiusM)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-text-muted/70" />
                      {timeAgo(vendor.createdAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Details Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedVendor ? (
                <motion.div
                  key={selectedVendor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="clay-card p-6 space-y-6"
                >
                  <div className="flex justify-between items-start gap-4 pb-4 border-b border-white/5">
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">
                        {selectedVendor.businessName}
                      </h2>
                      <p className="text-xs text-brand-primary font-semibold mt-0.5">
                        Category: {selectedVendor.category}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(selectedVendor.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-4 py-2 bg-success hover:bg-success/95 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 select-none"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => setRejectingVendor(selectedVendor)}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-4 py-2 bg-danger hover:bg-danger/95 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 select-none"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* Vendor Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Owner Metadata */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          Owner Info
                        </h3>
                        <div className="text-xs text-text-secondary bg-surface-tertiary p-3 rounded-xl space-y-1.5 border border-white/5">
                          <p>
                            <span className="text-text-muted">Name:</span>{" "}
                            <span className="font-semibold text-text-primary">
                              {selectedVendor.user?.name || "Unspecified"}
                            </span>
                          </p>
                          <p>
                            <span className="text-text-muted">Phone:</span>{" "}
                            {selectedVendor.user?.phone ? (
                              <a
                                href={telLink(selectedVendor.user.phone)}
                                className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {formatPhone(selectedVendor.user.phone)}
                              </a>
                            ) : (
                              "None"
                            )}
                          </p>
                          <p>
                            <span className="text-text-muted">Email:</span>{" "}
                            <span className="font-semibold text-text-primary">
                              {selectedVendor.user?.email || "None"}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5 text-text-muted text-[11px] mt-2 pt-2 border-t border-white/5">
                            <Clock className="h-3.5 w-3.5 text-text-muted shrink-0" />
                            <span>Submitted {timeAgo(selectedVendor.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          Uploaded Documents
                        </h3>
                        {selectedVendor.idDocumentUrl ? (
                          <div className="flex items-center justify-between bg-surface-tertiary p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-brand-primary" />
                              <span className="text-xs font-semibold text-text-primary truncate max-w-[150px]">
                                Verification ID Proof
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                const url = getFileUrl(selectedVendor.idDocumentUrl);
                                if (url) setModalDocUrl(url);
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-brand-primary hover:underline select-none"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View File</span>
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted italic">
                            No documents uploaded yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Service range map */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                        Service Range
                      </h3>
                      <div className="h-44 relative rounded-2xl overflow-hidden border border-white/5">
                        <Map
                          center={[selectedVendor.lat, selectedVendor.lng]}
                          radiusMeters={selectedVendor.serviceRadiusM}
                        />
                      </div>
                      <p className="text-[10px] text-text-muted text-right flex items-center justify-end gap-1">
                        <MapPin className="h-3 w-3 text-text-muted" />
                        Coverage Radius: {formatDistance(selectedVendor.serviceRadiusM)}
                      </p>
                    </div>
                  </div>

                  {/* Business Description */}
                  {selectedVendor.description && (
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Business Description
                      </h3>
                      <p className="text-xs text-text-secondary bg-surface-tertiary p-3.5 rounded-xl border border-white/5 leading-relaxed">
                        {selectedVendor.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="clay-card p-12 text-center flex flex-col justify-center items-center h-full min-h-[400px]">
                  <ClipboardList className="h-12 w-12 text-text-muted opacity-30 mb-3 animate-pulse" />
                  <h3 className="font-bold text-text-secondary">No Application Selected</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Select a vendor registration card from the queue list to begin review.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {modalDocUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-strong border border-white/10 max-w-2xl w-full p-4 rounded-3xl relative flex flex-col items-center">
            <button
              onClick={() => setModalDocUrl(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary text-xs font-bold px-3 py-1 glass rounded-xl select-none"
            >
              Close
            </button>
            <h3 className="font-bold text-sm text-text-primary mb-4">Document Proof Preview</h3>
            {/* Display on-disk image or pdf link */}
            <div className="w-full h-96 relative flex items-center justify-center bg-black/30 rounded-2xl overflow-hidden p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modalDocUrl}
                alt="Document preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
            <a
              href={modalDocUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 text-xs font-bold text-brand-primary hover:underline"
            >
              Open in new tab
            </a>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingVendor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-strong border border-white/10 max-w-md w-full p-6 rounded-3xl relative space-y-4">
            <h3 className="font-bold text-lg text-text-primary">Reject Application</h3>
            <p className="text-xs text-text-muted">
              Explain why this business registration profile is being rejected. The user will be requested to resolve this reason and re-submit.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Document image is blurry / Shop photo does not match address..."
              rows={4}
              className="w-full rounded-xl py-3 px-4 text-xs glass focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted resize-none text-text-primary"
            />

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setRejectingVendor(null);
                  setRejectReason("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-white/10 glass text-xs font-bold rounded-xl hover:bg-white/5 transition-colors select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-danger text-white text-xs font-bold rounded-xl hover:bg-danger/95 shadow-md transition-colors disabled:opacity-50 select-none"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
