"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Star,
  MessageSquare,
  ShieldAlert,
  Heart,
  Share2,
  Scale,
} from "lucide-react";
import { cn, formatDistance, telLink, whatsappLink } from "@/lib/utils";
import Link from "next/link";

export interface VendorItem {
  id: string;
  userId: string;
  category: string;
  businessName: string;
  description: string | null;
  lat: number;
  lng: number;
  serviceRadiusM: number;
  priceInfo: any;
  workingHours: any;
  verificationTier: "UNVERIFIED" | "ID_VERIFIED" | "TOP_RATED";
  ratingAvg: number;
  ratingCount: number;
  responseTimeMin: number | null;
  phone: string | null;
  distance: number;
}

interface VendorCardProps {
  item: VendorItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onShare: (businessName: string, id: string) => void;
  onBookClick: (item: VendorItem) => void;
  onChatClick: (recipientUserId: string) => void;
}

export function VendorCard({
  item,
  isFavorite,
  onToggleFavorite,
  onShare,
  onBookClick,
  onChatClick,
}: VendorCardProps) {
  const price = item.priceInfo as Record<string, any> | null;
  const hours = item.workingHours as Record<string, any> | null;

  // Helper: Check if vendor is currently open
  const isOpenNow = (workingHours: Record<string, any> | null): boolean | null => {
    if (!workingHours || !workingHours.open || !workingHours.close) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = workingHours.open.split(":").map(Number);
    const [closeH, closeM] = workingHours.close.split(":").map(Number);
    const openMin = openH * 60 + (openM || 0);
    const closeMin = closeH * 60 + (closeM || 0);
    
    if (closeMin > openMin) {
      return currentMinutes >= openMin && currentMinutes <= closeMin;
    } else {
      // Wraps midnight
      return currentMinutes >= openMin || currentMinutes <= closeMin;
    }
  };

  const openStatus = isOpenNow(hours);

  // Get color code for distance
  const getDistanceColor = (meters: number) => {
    if (meters < 1000) return "text-success bg-success/5 border-success/10";
    if (meters < 3000) return "text-warning bg-warning/5 border-warning/10";
    return "text-brand-primary bg-brand-primary/5 border-brand-primary/10";
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
      }}
      className="clay-card card-spotlight p-5 flex flex-col justify-between h-full group"
    >
      <div className="space-y-2.5">
        {/* Header: Business name + verification badge */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors line-clamp-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {item.businessName}
          </h3>

          {/* Verification tiers */}
          {item.verificationTier === "TOP_RATED" ? (
            <span className="flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning border border-warning/20 animate-shimmer select-none shrink-0">
              <Star className="h-2.5 w-2.5 fill-warning text-warning" />
              <span>Top Rated</span>
            </span>
          ) : item.verificationTier === "ID_VERIFIED" ? (
            <span className="flex items-center gap-0.5 rounded-full bg-verified-blue/10 px-2 py-0.5 text-[10px] font-bold text-verified-blue shrink-0">
              <CheckCircle className="h-2.5 w-2.5" />
              <span>ID Verified</span>
            </span>
          ) : (
            <span className="flex items-center gap-0.5 rounded-full bg-text-muted/10 px-2 py-0.5 text-[10px] font-semibold text-text-muted shrink-0">
              <ShieldAlert className="h-2.5 w-2.5" />
              <span>Unverified</span>
            </span>
          )}
        </div>

        {/* Distance & rating summary */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary items-center">
          <span className={cn("flex items-center gap-1 font-medium px-2 py-0.5 rounded-full border", getDistanceColor(item.distance))}>
            <MapPin className="h-3 w-3" />
            <span>{formatDistance(item.distance)}</span>
          </span>

          {item.ratingCount > 0 ? (
            <span className="flex items-center gap-0.5 text-warning font-semibold bg-warning/5 px-2 py-0.5 rounded-full border border-warning/10">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span>{item.ratingAvg}</span>
              <span className="text-[10px] text-text-muted ml-0.5">
                ({item.ratingCount})
              </span>
            </span>
          ) : (
            <span className="text-[10px] text-text-muted bg-text-muted/5 px-2 py-0.5 rounded-full border border-text-muted/10">No reviews</span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Timing / Price Box */}
        <div className="text-xs text-text-secondary bg-surface-tertiary p-2.5 rounded-xl space-y-1.5 border border-white/5">
          {price && (
            <div className="flex justify-between">
              <span className="text-text-muted">Price</span>
              <span className="font-bold text-text-primary">
                ₹{price.rate} / {price.unit}
              </span>
            </div>
          )}

          {hours && (
            <div className="flex justify-between">
              <span className="text-text-muted">Hours</span>
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <Clock className="h-3 w-3 text-text-muted" />
                <span>
                  {hours.open} - {hours.close}
                </span>
              </span>
            </div>
          )}

          {/* Open/Closed live indicator */}
          {openStatus !== null && (
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                openStatus ? "status-open" : "status-closed"
              )}>
                <span className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  openStatus ? "bg-success animate-pulse" : "bg-danger"
                )} />
                {openStatus ? "Open Now" : "Closed"}
              </span>
            </div>
          )}

          {item.responseTimeMin && (
            <div className="flex justify-between">
              <span className="text-text-muted">Replies in</span>
              <span className="font-medium text-success">
                ~{item.responseTimeMin} mins
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions: Favorite + Share */}
      <div className="flex items-center gap-1.5 mt-4">
        <button
          onClick={() => onToggleFavorite(item.id)}
          className="flex h-8 w-8 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all active:scale-95"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-4 w-4 transition-transform hover:scale-110", isFavorite ? "fill-danger text-danger" : "text-text-muted")} />
        </button>
        <button
          onClick={() => onShare(item.businessName, item.id)}
          className="flex h-8 w-8 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all active:scale-95"
          aria-label="Share vendor"
        >
          <Share2 className="h-4 w-4 text-text-muted hover:text-text-primary transition-colors" />
        </button>
      </div>

      {/* Actions: Call, WhatsApp, Book, Chat */}
      <div className="mt-3 pt-3.5 border-t border-white/5 space-y-2">
        {item.phone && (
          <div className="flex gap-2">
            <a
              href={telLink(item.phone)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 glass py-2 text-xs font-bold text-text-primary hover:bg-white/5 transition-all select-none active:scale-[0.98]"
            >
              <Phone className="h-3.5 w-3.5 text-success" />
              <span>Call</span>
            </a>
            <a
              href={whatsappLink(
                item.phone,
                `Hello ${item.businessName}, I found you on NeighborLink and would like to book a service!`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 glass py-2 text-xs font-bold text-text-primary hover:bg-white/5 transition-all select-none active:scale-[0.98]"
            >
              <MessageSquare className="h-3.5 w-3.5 text-success fill-success/10" />
              <span>WhatsApp</span>
            </a>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => onBookClick(item)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent py-2 text-xs font-bold text-white hover:brightness-110 shadow-md transition-all select-none active:scale-[0.98]"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Book Slot</span>
          </button>
          <button
            onClick={() => onChatClick(item.userId)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-brand-primary/30 bg-brand-primary/5 py-2 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 transition-all select-none active:scale-[0.98]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/vendor/${item.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/5 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all select-none text-center"
          >
            View Profile →
          </Link>
          <Link
            href={`/compare?ids=${item.id}`}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/5 px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:text-brand-primary hover:bg-white/5 transition-all select-none text-center"
          >
            <Scale className="h-3 w-3" />
            Compare
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
