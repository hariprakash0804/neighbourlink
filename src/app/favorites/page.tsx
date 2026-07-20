"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Star,
  Phone,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Award,
  Trash2,
  MapPin,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, formatPhone, telLink } from "@/lib/utils";
import { VENDOR_CATEGORY_META } from "@/lib/constants";
import { AuthModal } from "@/components/auth/AuthModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function FavoritesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.favorites.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const toggleFavorite = trpc.favorites.toggle.useMutation({
    onMutate: (variables) => {
      setRemovingId(variables.vendorId);
    },
    onSettled: () => {
      setRemovingId(null);
    },
    onSuccess: () => refetch(),
  });

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 page-enter">
        <div className="clay-card p-8 text-center max-w-md w-full space-y-4">
          <Heart className="h-12 w-12 text-text-muted mx-auto" />
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Sign In to View Favorites
          </h2>
          <p className="text-xs text-text-secondary">
            Save your go-to vendors and access them quickly.
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

  // Loading state
  if (isLoading || status === "loading") {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton-clay h-9 w-9 rounded-xl" />
          <div className="skeleton-clay h-6 w-48 rounded-lg" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-clay h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const favorites = data?.favorites || [];

  return (
    <div className="min-h-screen pb-24 page-enter">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 text-text-secondary transition-all"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1
              className="text-lg font-black tracking-tight flex items-center gap-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Heart className="h-5 w-5 text-danger fill-danger" />
              Saved Vendors
            </h1>
            <p className="text-xs text-text-secondary">
              {favorites.length} vendor{favorites.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {favorites.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="clay-card p-12 text-center"
          >
            <Heart className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h3
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              No Saved Vendors Yet
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
              Browse the directory and tap the heart icon on any vendor to save them here for quick access.
            </p>
            <button
              onClick={() => router.push("/directory")}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <MapPin className="h-4 w-4" />
              Browse Directory
            </button>
          </motion.div>
        ) : (
          /* Favorites list */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {favorites.map((fav) => {
                const catMeta = VENDOR_CATEGORY_META.find((c) => c.value === fav.vendor.category);
                const CatIcon = catMeta?.icon;

                return (
                  <motion.div
                    key={fav.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.2 } }}
                    layout
                    className="glass rounded-2xl p-5 flex items-start gap-4 group hover:shadow-elevated transition-all hover-glow cursor-pointer"
                    onClick={() => router.push(`/vendor/${fav.vendor.id}`)}
                  >
                    {/* Category icon */}
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${catMeta?.color || "#6366f1"}15` }}
                    >
                      {CatIcon && (
                        <CatIcon
                          className="h-6 w-6"
                          style={{ color: catMeta?.color || "#6366f1" }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold truncate">
                          {fav.vendor.businessName}
                        </h3>
                        {fav.vendor.verificationTier === "TOP_RATED" && (
                          <Award className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                        {fav.vendor.verificationTier === "ID_VERIFIED" && (
                          <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted mb-2">
                        {catMeta?.label || fav.vendor.category}
                      </p>
                      <div className="flex items-center gap-3">
                        {fav.vendor.ratingCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">{fav.vendor.ratingAvg.toFixed(1)}</span>
                            <span className="text-text-muted">({fav.vendor.ratingCount})</span>
                          </div>
                        )}
                        {fav.vendor.phone && (
                          <a
                            href={telLink(fav.vendor.phone)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-success hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {formatPhone(fav.vendor.phone)}
                          </a>
                        )}
                        {fav.vendor.userId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/chat?recipientId=${fav.vendor.userId}`);
                            }}
                            className="flex items-center gap-1 text-xs text-brand-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      disabled={toggleFavorite.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite.mutate({ vendorId: fav.vendor.id });
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0 relative group/btn",
                        toggleFavorite.isPending && removingId === fav.vendor.id
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-danger/10"
                      )}
                      aria-label="Remove from favorites"
                    >
                      <Heart className="h-4.5 w-4.5 text-danger fill-danger group-hover/btn:scale-0 transition-transform duration-200" />
                      <Trash2 className="h-4.5 w-4.5 text-danger absolute scale-0 group-hover/btn:scale-100 transition-transform duration-200" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
