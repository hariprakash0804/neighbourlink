"use client";

import { motion } from "framer-motion";
import { Home, Search, AlertTriangle, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "sos", label: "SOS", icon: AlertTriangle, isSos: true },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "profile", label: "Profile", icon: User },
] as const;

export function MobileBottomNav() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-strong border-t border-white/10">
      <div className="flex items-center justify-around px-2" style={{ height: "var(--app-mobile-nav-height)" }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isSos = "isSos" in item && item.isSos;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-2xl transition-all",
                isSos && "relative -mt-5"
              )}
            >
              {isSos ? (
                /* SOS Button — Skeuomorphic, raised red */
                <div className="sos-button flex h-14 w-14 items-center justify-center text-white">
                  <Icon className="h-6 w-6" />
                </div>
              ) : (
                <>
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                    isActive && "bg-brand-primary/10"
                  )}>
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-brand-primary" : "text-text-muted"
                      )}
                    />
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 h-1 w-5 rounded-full bg-brand-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isSos
                    ? "text-danger font-bold mt-1"
                    : isActive
                    ? "text-brand-primary"
                    : "text-text-muted"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe area padding for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
