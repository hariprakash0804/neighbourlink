"use client";

import { useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Shield,
  ShieldCheck,
  Award,
  ChevronLeft,
  Send,
  Calendar,
  User as UserIcon,
  Sparkles,
  Flag,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, formatPhone, telLink, whatsappLink } from "@/lib/utils";
import { VENDOR_CATEGORY_META } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/auth/AuthModal";

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({
  rating,
  size = "md",
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-7 w-7" };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hover || rating) : star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={cn(
              "transition-all duration-150",
              interactive && "cursor-pointer hover:scale-125",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-white/20"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Rating Histogram Bar ─────────────────────────────────────────────────────
function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-text-secondary font-medium">{stars}</span>
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
        />
      </div>
      <span className="w-6 text-right text-text-secondary tabular-nums">{count}</span>
    </div>
  );
}

// ─── Badge Tier Component ─────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: string }) {
  if (tier === "TOP_RATED") {
    return (
      <motion.span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30"
        animate={{ boxShadow: ["0 0 8px rgba(245,158,11,0.2)", "0 0 16px rgba(245,158,11,0.4)", "0 0 8px rgba(245,158,11,0.2)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Award className="h-3 w-3" />
        Top Rated
      </motion.span>
    );
  }
  if (tier === "ID_VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
        <ShieldCheck className="h-3 w-3" />
        ID Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 text-text-secondary border border-white/10">
      <Shield className="h-3 w-3" />
      Unverified
    </span>
  );
}

// ─── Main Page Content ────────────────────────────────────────────────────────
function VendorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const { data: session } = useSession();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  // Fetch vendor profile
  const { data: vendorData, isLoading: vendorLoading } = trpc.directory.getVendorById.useQuery(
    { vendorId },
    { enabled: !!vendorId }
  );

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = trpc.review.listForVendor.useQuery(
    { vendorId, page: reviewPage, limit: 10 },
    { enabled: !!vendorId }
  );

  // Submit review mutation
  const submitReview = trpc.review.create.useMutation({
    onSuccess: () => {
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment("");
      refetchReviews();
    },
  });

  // Submit report mutation & states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const submitReport = trpc.report.create.useMutation({
    onSuccess: () => {
      setReportSuccess(true);
      setReportReason("");
      setTimeout(() => {
        setShowReportForm(false);
        setReportSuccess(false);
      }, 2500);
    },
  });

  const vendor = vendorData?.vendor;
  const categoryMeta = VENDOR_CATEGORY_META.find((c) => c.value === vendor?.category);

  // Build rating distribution from reviews
  const ratingDist = [0, 0, 0, 0, 0]; // index 0 = 1-star, etc.
  if (reviewsData?.reviews) {
    reviewsData.reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++;
    });
  }

  const handleWriteReview = () => {
    if (!session?.user) {
      setIsAuthModalOpen(true);
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = () => {
    if (reviewRating === 0) return;
    submitReview.mutate({
      vendorId,
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    });
  };

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-text-secondary text-sm">Vendor not found.</p>
          <button
            onClick={() => router.back()}
            className="text-brand-primary text-sm font-medium"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* ─── Hero Header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/15 via-surface-primary/50 to-surface-primary" />
        <div className="relative max-w-2xl mx-auto px-4 pt-6 pb-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {/* Vendor Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Category Icon Circle */}
              <div
                className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${categoryMeta?.color || "#6366f1"}20` }}
              >
                {categoryMeta?.icon && (
                  <categoryMeta.icon
                    className="h-8 w-8"
                    style={{ color: categoryMeta.color }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black tracking-tight leading-tight">
                  {vendor.businessName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${categoryMeta?.color || "#6366f1"}20`,
                      color: categoryMeta?.color || "#6366f1",
                    }}
                  >
                    {categoryMeta?.label || vendor.category}
                  </span>
                  <TierBadge tier={vendor.verificationTier} />
                </div>
              </div>
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-black tabular-nums">
                  {vendor.ratingAvg > 0 ? vendor.ratingAvg.toFixed(1) : "—"}
                </span>
              </div>
              <span className="text-sm text-text-secondary">
                {vendor.ratingCount > 0
                  ? `${vendor.ratingCount} review${vendor.ratingCount !== 1 ? "s" : ""}`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Description */}
            {vendor.description && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {vendor.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Info Cards ────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {vendor.phone && (
            <a
              href={telLink(vendor.phone)}
              className="flex items-center gap-2.5 p-3 rounded-xl glass border border-white/10 hover:bg-white/5 transition-all"
            >
              <Phone className="h-4 w-4 text-success" />
              <span className="text-xs font-medium truncate">{formatPhone(vendor.phone)}</span>
            </a>
          )}
          {vendor.responseTimeMin && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl glass border border-white/10">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium">
                Responds in ~{vendor.responseTimeMin} min
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5 p-3 rounded-xl glass border border-white/10">
            <MapPin className="h-4 w-4 text-brand-primary" />
            <span className="text-xs font-medium">
              {(vendor.serviceRadiusM / 1000).toFixed(1)} km radius
            </span>
          </div>
          {vendor.workingHours && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl glass border border-white/10">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium">
                {(vendor.workingHours as any)?.start || "N/A"} – {(vendor.workingHours as any)?.end || "N/A"}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!session?.user) {
                setIsAuthModalOpen(true);
              } else {
                router.push(`/chat?recipientId=${vendor.userId}`);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-primary to-indigo-600 text-white text-sm font-bold shadow-lg hover:brightness-110 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          {vendor.phone && (
            <a
              href={whatsappLink(vendor.phone, `Hi ${vendor.businessName}, I found you on NeighborLink.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-sm font-bold hover:bg-emerald-600/30 transition-all"
            >
              WhatsApp
            </a>
          )}
          <button
            onClick={() => {
              if (!session?.user) {
                setIsAuthModalOpen(true);
              } else {
                setShowReportForm(!showReportForm);
              }
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border",
              showReportForm
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10"
            )}
          >
            <Flag className="h-4 w-4" />
            <span>Report</span>
          </button>
        </div>

        {/* Report Form Expander */}
        <AnimatePresence>
          {showReportForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="glass rounded-xl border border-destructive/20 p-4 space-y-4">
                <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                  <Flag className="h-4 w-4" />
                  <span>Report this Business</span>
                </h3>
                
                {reportSuccess ? (
                  <p className="text-xs text-success font-semibold py-2">
                    ✅ Report submitted successfully. Our safety moderators will review it shortly.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Please describe why you are flagging this profile (e.g. incorrect contact info, unprofessional behavior, or fraudulent listings). Minimum 10 characters.
                    </p>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Specify your reason..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-destructive/50 resize-none"
                      rows={3}
                      maxLength={1000}
                    />

                    {submitReport.error && (
                      <p className="text-xs text-red-400">{submitReport.error.message}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (reportReason.trim().length < 10) return;
                          submitReport.mutate({
                            targetType: "VENDOR",
                            targetId: vendor.id,
                            reason: reportReason.trim(),
                          });
                        }}
                        disabled={reportReason.trim().length < 10 || submitReport.isPending}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                          reportReason.trim().length >= 10
                            ? "bg-destructive text-white hover:brightness-110 shadow-md"
                            : "bg-white/5 text-text-secondary cursor-not-allowed"
                        )}
                      >
                        {submitReport.isPending ? (
                          <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          "Submit Report"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowReportForm(false);
                          setReportReason("");
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary border border-white/10 hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Reviews Section ───────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Reviews
          </h2>
          <button
            onClick={handleWriteReview}
            className="text-xs font-bold text-brand-primary hover:underline"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Histogram */}
        {reviewsData && reviewsData.total > 0 && (
          <div className="glass rounded-xl border border-white/10 p-4 mb-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => (
              <RatingBar
                key={stars}
                stars={stars}
                count={ratingDist[stars - 1]}
                total={reviewsData.total}
              />
            ))}
          </div>
        )}

        {/* Write Review Form */}
        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="glass rounded-xl border border-brand-primary/20 p-4 space-y-4">
                <h3 className="text-sm font-bold">Your Review</h3>
                <div className="space-y-1">
                  <p className="text-xs text-text-secondary">Rating</p>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onRate={setReviewRating}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-text-secondary">Comment (optional)</p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-brand-primary/50 resize-none"
                    rows={3}
                    maxLength={2000}
                  />
                </div>

                {submitReview.error && (
                  <p className="text-xs text-red-400">{submitReview.error.message}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewRating === 0 || submitReview.isPending}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                      reviewRating > 0
                        ? "bg-gradient-to-r from-brand-primary to-indigo-600 text-white shadow-md hover:brightness-110"
                        : "bg-white/5 text-text-secondary cursor-not-allowed"
                    )}
                  >
                    {submitReview.isPending ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Submit Review
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewComment("");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-secondary border border-white/10 hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <span className="animate-spin h-6 w-6 border-2 border-brand-primary border-t-transparent rounded-full" />
          </div>
        ) : reviewsData && reviewsData.reviews.length > 0 ? (
          <div className="space-y-3">
            {reviewsData.reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl border border-white/10 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <UserIcon className="h-3.5 w-3.5 text-brand-primary" />
                    </div>
                    <span className="text-sm font-bold">{review.userName}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {review.comment}
                  </p>
                )}
                <p className="text-[10px] text-text-secondary/60">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            ))}

            {/* Pagination */}
            {reviewsData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                  disabled={reviewPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all"
                >
                  Previous
                </button>
                <span className="text-xs text-text-secondary tabular-nums">
                  {reviewPage} / {reviewsData.totalPages}
                </span>
                <button
                  onClick={() => setReviewPage((p) => Math.min(reviewsData.totalPages, p + 1))}
                  disabled={reviewPage === reviewsData.totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="rounded-full bg-white/5 p-4 w-fit mx-auto">
              <Star className="h-8 w-8 text-text-secondary/30" />
            </div>
            <p className="text-sm text-text-secondary">No reviews yet. Be the first!</p>
            <button
              onClick={handleWriteReview}
              className="text-xs font-bold text-brand-primary hover:underline"
            >
              Write a Review →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-primary flex items-center justify-center">
          <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <VendorDetailContent />
    </Suspense>
  );
}
