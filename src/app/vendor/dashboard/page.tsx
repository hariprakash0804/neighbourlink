"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowLeft,
  TrendingUp,
  Star,
  ShieldCheck,
  Zap,
  Tag,
  Plus,
  Trash2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type TabType = "PENDING" | "ACCEPTED" | "HISTORY" | "REVIEWS" | "DEALS";

export default function VendorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  // New Deal Form States
  const [dealTitle, setDealTitle] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [dealDiscount, setDealDiscount] = useState(10);
  const [dealDuration, setDealDuration] = useState(24);
  const [dealError, setDealError] = useState("");

  // Fetch bookings
  const { data: data, isLoading, error, refetch } = trpc.booking.listForVendor.useQuery({}, {
    retry: false,
  });

  // Fetch own vendor profile
  const { data: ownProfile, isLoading: isProfileLoading } = trpc.vendor.getOwnProfile.useQuery(
    undefined,
    {
      retry: false,
      enabled: !error,
    }
  );

  // Fetch reviews if ownProfile is available
  const { data: reviewsData, isLoading: isReviewsLoading } = trpc.review.listForVendor.useQuery(
    { vendorId: ownProfile?.id || "" },
    { enabled: !!ownProfile?.id }
  );

  // Fetch active deals
  const { data: dealsData, isLoading: isDealsLoading, refetch: refetchDeals } = trpc.deals.listActive.useQuery(
    undefined,
    { enabled: !!ownProfile?.id }
  );

  const createDealMutation = trpc.deals.create.useMutation({
    onSuccess: () => {
      setIsDealModalOpen(false);
      setDealTitle("");
      setDealDesc("");
      setDealDiscount(10);
      setDealDuration(24);
      refetchDeals();
    },
    onError: (err) => {
      setDealError(err.message || "Failed to create deal.");
    },
  });

  const deleteDealMutation = trpc.deals.delete.useMutation({
    onSuccess: () => {
      refetchDeals();
    },
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

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealError("");
    if (!dealTitle.trim() || !dealDesc.trim()) {
      setDealError("Title and description are required.");
      return;
    }
    try {
      await createDealMutation.mutateAsync({
        title: dealTitle.trim(),
        description: dealDesc.trim(),
        discountPercent: dealDiscount,
        durationHours: dealDuration,
      });
    } catch (err: any) {
      setDealError(err.message || "Failed to post deal.");
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm("Are you sure you want to remove this discount offer?")) return;
    try {
      await deleteDealMutation.mutateAsync({ dealId });
    } catch (err) {
      console.error("Failed to delete deal:", err);
    }
  };

  const isForbidden = error?.shape?.message?.includes("must be registered as a vendor") || error?.shape?.code === -32603;

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-surface-primary text-text-primary flex flex-col items-center justify-center px-4">
        {/* Back button */}
        <div className="max-w-md w-full mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-surface-secondary px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>

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
  const completedJobs = bookings.filter((b) => b.status === "COMPLETED");
  const historyJobs = bookings.filter((b) => ["COMPLETED", "DECLINED", "CANCELLED"].includes(b.status));

  // Filter deals owned by this vendor
  const myDeals = dealsData?.deals.filter((d) => d.vendorId === ownProfile?.id) || [];

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
    <div className="min-h-screen bg-surface-primary text-text-primary px-4 md:px-8 py-10 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/5 bg-surface-secondary px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all shadow-sm select-none mt-12"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Business Portal</span>
            {isProfileLoading ? (
              <span className="inline-block w-20 h-4 rounded animate-pulse bg-white/10 ml-2" />
            ) : (
              ownProfile?.verificationTier && (
                <span className="flex items-center gap-1 text-[10px] text-verified-blue font-extrabold uppercase bg-verified-blue/10 px-2 py-0.5 rounded-full border border-verified-blue/20 ml-2">
                  <ShieldCheck className="h-3 w-3" />
                  {ownProfile.verificationTier}
                </span>
              )
            )}
          </div>
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-text-secondary to-text-muted bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isProfileLoading ? (
              <span className="inline-block w-48 h-8 rounded animate-pulse bg-white/10" />
            ) : (
              ownProfile?.businessName || "My Job Board"
            )}
          </h1>
          <p className="text-sm text-text-secondary max-w-xl">
            {isProfileLoading ? (
              <span className="inline-block w-96 h-4 rounded animate-pulse bg-white/10" />
            ) : (
              ownProfile?.description || "Manage incoming neighborhood service bookings, view customer details, and update job status."
            )}
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <Link
            href="/vendor/dashboard/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 active:scale-98 transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span>View Analytics</span>
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Active Jobs</span>
            <span className="text-lg font-black">{activeJobs.length}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Pending</span>
            <span className="text-lg font-black">{pendingJobs.length}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Completed</span>
            <span className="text-lg font-black">{completedJobs.length}</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-top-rated-gold/10 text-top-rated-gold flex items-center justify-center shrink-0">
            <Star className="h-5 w-5 fill-top-rated-gold text-top-rated-gold" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted block font-semibold uppercase">Average Rating</span>
            <span className="text-lg font-black">
              {isProfileLoading ? (
                <span className="inline-block w-16 h-5 rounded animate-pulse bg-white/10" />
              ) : ownProfile?.ratingCount ? (
                `${ownProfile.ratingAvg}★ (${ownProfile.ratingCount})`
              ) : (
                "No Ratings"
              )}
            </span>
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
            { id: "REVIEWS", label: `Reviews (${reviewsData?.total || 0})` },
            { id: "DEALS", label: `Discount Deals (${myDeals.length})` },
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

      {/* Main tab panel */}
      {activeTab === "REVIEWS" ? (
        <div className="space-y-4">
          {isReviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
            </div>
          ) : !reviewsData?.reviews.length ? (
            <div className="clay-card p-8 text-center max-w-md mx-auto space-y-3">
              <div className="rounded-full bg-surface-tertiary p-4 border border-white/5 text-text-muted w-fit mx-auto">
                <Star className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-bold text-text-primary">No reviews yet</h3>
              <p className="text-xs text-text-secondary">
                You haven&apos;t received any customer ratings or feedback yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviewsData.reviews.map((review) => (
                <div key={review.id} className="clay-card p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{review.userName}</h4>
                      <p className="text-[10px] text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating ? "fill-top-rated-gold text-top-rated-gold" : "text-text-muted/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-tertiary/50 p-2.5 rounded-xl">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "DEALS" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-primary">My Active Discount Deals</h3>
            <button
              onClick={() => {
                setDealError("");
                setIsDealModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post New Deal</span>
            </button>
          </div>

          {isDealsLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
            </div>
          ) : myDeals.length === 0 ? (
            <div className="clay-card p-8 text-center max-w-md mx-auto space-y-3">
              <div className="rounded-full bg-surface-tertiary p-4 border border-white/5 text-text-muted w-fit mx-auto">
                <Tag className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-bold text-text-primary">No deals posted</h3>
              <p className="text-xs text-text-secondary">
                Promote your business by offering special time-limited discounts to neighbors.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myDeals.map((deal) => (
                <div key={deal.id} className="clay-card p-5 flex flex-col justify-between border border-white/5 relative overflow-hidden group">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-white bg-success px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-current text-white" />
                        <span>{deal.discountPercent}% OFF</span>
                      </span>
                      <span className="text-[9px] text-text-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Ends: {new Date(deal.validUntil).toLocaleString("en-IN")}</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-text-primary">{deal.title}</h4>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-tertiary/30 p-2.5 rounded-xl">
                      {deal.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3.5 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-xs font-bold text-destructive px-3 py-1.5 transition-all select-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Offer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Booking list */
        isLoading ? (
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
              You don&apos;t have any appointments in this status folder.
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
                        <p className="line-clamp-2 italic">&ldquo;{b.notes}&rdquo;</p>
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
        )
      )}

      {/* Post Deal Modal */}
      <AnimatePresence>
        {isDealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="clay-card max-w-md w-full p-6 space-y-4 border border-white/10 shadow-elevated"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Tag className="h-4.5 w-4.5 text-brand-primary" />
                  <span>Post Discount Offer</span>
                </h3>
                <button
                  onClick={() => setIsDealModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-text-secondary"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">
                    Offer Title
                  </label>
                  <input
                    type="text"
                    required
                    value={dealTitle}
                    onChange={(e) => setDealTitle(e.target.value)}
                    placeholder="e.g. 20% off all Plumbing services"
                    className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-text-secondary/60 uppercase font-black block">
                    Description
                  </label>
                  <textarea
                    required
                    value={dealDesc}
                    onChange={(e) => setDealDesc(e.target.value)}
                    placeholder="Describe the offer details, terms, or scope of services included..."
                    rows={3}
                    className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={dealDiscount}
                      onChange={(e) => setDealDiscount(Number(e.target.value))}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-text-secondary/60 uppercase font-black block">
                      Duration (Hours)
                    </label>
                    <select
                      value={dealDuration}
                      onChange={(e) => setDealDuration(Number(e.target.value))}
                      className="w-full rounded-2xl bg-white/5 border border-white/10 py-3 px-4 text-xs text-text-primary focus:outline-none focus:border-brand-primary"
                    >
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                      <option value={48}>2 Days</option>
                      <option value={72}>3 Days</option>
                      <option value={168}>1 Week</option>
                    </select>
                  </div>
                </div>

                {dealError && (
                  <p className="text-xs font-semibold text-danger">{dealError}</p>
                )}

                <button
                  type="submit"
                  disabled={createDealMutation.isPending}
                  className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent py-3.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {createDealMutation.isPending ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current text-white" />
                      <span>Publish Offer</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
