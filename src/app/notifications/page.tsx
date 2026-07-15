"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Star,
  MessageSquare,
  Info,
  ShieldCheck,
  ChevronLeft,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/AuthModal";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// Icon and color mapping for notification types
const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  BOOKING_UPDATE: { icon: CalendarDays, color: "#6366f1", bgColor: "rgba(99,102,241,0.1)" },
  NEW_REVIEW: { icon: Star, color: "#f59e0b", bgColor: "rgba(245,158,11,0.1)" },
  NEW_MESSAGE: { icon: MessageSquare, color: "#10b981", bgColor: "rgba(16,185,129,0.1)" },
  SYSTEM: { icon: Info, color: "#3b82f6", bgColor: "rgba(59,130,246,0.1)" },
  VENDOR_VERIFIED: { icon: ShieldCheck, color: "#8b5cf6", bgColor: "rgba(139,92,246,0.1)" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.notifications.list.useQuery(
    { page: 1, limit: 50 },
    { enabled: status === "authenticated" }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  // Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 page-enter">
        <div className="clay-card p-8 text-center max-w-md w-full space-y-4">
          <Bell className="h-12 w-12 text-text-muted mx-auto" />
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Sign In to View Notifications
          </h2>
          <p className="text-xs text-text-secondary">
            Stay updated on bookings, reviews, messages, and more.
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
      <div className="max-w-2xl mx-auto p-4 mt-6 space-y-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton-clay h-9 w-9 rounded-xl" />
          <div className="skeleton-clay h-6 w-48 rounded-lg" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-glass h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pb-24 page-enter">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-secondary/20">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                <Bell className="h-5 w-5 text-brand-primary" />
                Notifications
              </h1>
              <p className="text-xs text-text-secondary">
                {session?.user?.name ? `Hey ${session.user.name.split(" ")[0]}, ` : ""}
                {unreadCount > 0
                  ? `you have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "you're all caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold text-brand-primary hover:scale-[1.02] transition-all"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <AnimatePresence mode="wait">
          {notifications.length === 0 ? (
            /* Empty state */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="clay-card p-12 text-center mt-8"
            >
              <Inbox className="h-16 w-16 text-text-muted mx-auto mb-4" />
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                No Notifications Yet
              </h3>
              <p className="text-sm text-text-secondary max-w-sm mx-auto">
                When you receive booking updates, reviews, or messages, they&apos;ll appear here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="notifications-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-2"
            >
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={notif.id}
                    variants={itemVariants}
                    onClick={() => {
                      if (!notif.read) {
                        markRead.mutate({ notificationId: notif.id });
                      }
                    }}
                    className={cn(
                      "glass rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all hover:shadow-elevated",
                      !notif.read && "border-l-4",
                      !notif.read && "border-brand-primary/50"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                      style={{ background: config.bgColor }}
                    >
                      <Icon className="h-5 w-5" style={{ color: config.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={cn(
                            "text-sm truncate",
                            !notif.read ? "font-bold text-text-primary" : "font-medium text-text-secondary"
                          )}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread dot */}
                    <AnimatePresence>
                      {!notif.read && (
                        <motion.div
                          key="unread-dot"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-center shrink-0 mt-2"
                        >
                          <div className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
