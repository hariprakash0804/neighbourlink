"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Tag,
  Clock,
  Building2,
  ChevronLeft,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

function CountdownTimer({ validUntil }: { validUntil: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(validUntil).getTime() - Date.now();
      if (difference <= 0) {
        return null;
      }
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (!left) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [validUntil]);

  if (!timeLeft) {
    return <span className="text-danger font-bold text-[10px]">Expired</span>;
  }

  return (
    <div className="flex gap-1 text-[10px] font-black tracking-tight text-white bg-danger/80 px-2 py-0.5 rounded-full items-center">
      <Clock className="h-3 w-3 animate-pulse" />
      <span>
        {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

function DealsContent() {
  const router = useRouter();

  // Fetch active deals
  const { data: dealsData, isLoading, error } = trpc.deals.listActive.useQuery();

  const deals = dealsData?.deals || [];

  return (
    <div className="min-h-screen bg-surface-primary text-text-primary pb-24">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5" />
        <div className="max-w-4xl mx-auto px-4 py-10 relative">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/5 text-text-secondary transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <Tag className="h-5.5 w-5.5 text-brand-primary" />
                Nearby Deals & Offers
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Exclusive neighborhood discounts and limited-time deals posted by local businesses.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="clay-card p-5 animate-pulse space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-12 rounded bg-surface-tertiary" />
                  <div className="h-4 w-16 rounded-full bg-surface-tertiary" />
                </div>
                <div className="h-5 w-3/4 rounded bg-surface-tertiary" />
                <div className="h-4 w-full rounded bg-surface-tertiary" />
                <div className="h-4 w-1/2 rounded bg-surface-tertiary" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-sm text-danger">Failed to load deals</p>
            <p className="text-xs text-text-muted">{error.message}</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
            <div className="rounded-full bg-brand-primary/10 p-5 border border-brand-primary/20 text-brand-primary w-fit mx-auto">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold">No Active Deals</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              There are no active discounts or promotional offers posted in your area right now. Check back later!
            </p>
            <button
              onClick={() => router.push("/directory")}
              className="rounded-2xl bg-brand-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
            >
              Explore Local Directory
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {deals.map((deal, idx) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="clay-card card-spotlight p-5 flex flex-col justify-between border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all"
              >
                <div>
                  {/* Deal Header Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="flex items-center gap-1 text-[11px] font-black text-white bg-success px-2.5 py-1 rounded-xl shadow-sm">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span>{deal.discountPercent}% OFF</span>
                    </span>
                    <CountdownTimer validUntil={deal.validUntil} />
                  </div>

                  {/* Title & Desc */}
                  <h3
                    className="text-sm font-extrabold text-text-primary group-hover:text-brand-primary transition-colors line-clamp-1 mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {deal.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">
                    {deal.description}
                  </p>
                </div>

                {/* Vendor Footer Details */}
                {deal.vendor && (
                  <div className="border-t border-white/5 pt-3.5 mt-auto flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-text-primary truncate max-w-[150px]">
                        {deal.vendor.businessName}
                      </p>
                      <p className="text-[9px] text-text-muted mt-0.5">{deal.vendor.category}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/directory?category=${deal.vendor?.category}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                      aria-label="View vendor details"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface-primary">
          <span className="animate-spin h-8 w-8 border-2 border-brand-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <DealsContent />
    </Suspense>
  );
}
