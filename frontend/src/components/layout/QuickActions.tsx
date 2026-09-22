"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  AlertTriangle,
  Megaphone,
  MapPin,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";

const FAB_ITEMS = [
  {
    id: "sos",
    label: "Emergency SOS",
    icon: AlertTriangle,
    color: "#ef4444",
    action: "sos",
  },
  {
    id: "civic",
    label: "Report Issue",
    icon: MapPin,
    color: "#f59e0b",
    action: "civic",
  },
  {
    id: "bulletin",
    label: "Create Post",
    icon: Megaphone,
    color: "#6366f1",
    action: "bulletin",
  },
  {
    id: "emergency",
    label: "Call 112",
    icon: Phone,
    color: "#10b981",
    action: "call112",
  },
] as const;

export function QuickActions() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleAction = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case "sos":
        window.dispatchEvent(new CustomEvent("trigger-sos"));
        break;
      case "civic":
        router.push("/community?tab=civic&create=true");
        break;
      case "bulletin":
        router.push("/community?tab=bulletin&create=true");
        break;
      case "call112":
        window.location.assign("tel:112");
        break;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-24 right-4 z-50 lg:hidden flex flex-col-reverse items-end gap-3 mb-safe">
        {/* Action Items */}
        <AnimatePresence>
          {isOpen &&
            FAB_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, scale: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { delay: index * 0.06, duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    y: 10,
                    transition: { delay: (FAB_ITEMS.length - index) * 0.04, duration: 0.2 },
                  }}
                  onClick={() => handleAction(item.action)}
                  className="flex items-center gap-3 rounded-2xl glass-strong px-4 py-3 shadow-elevated select-none"
                  aria-label={item.label}
                >
                  <span className="text-xs font-bold text-text-primary whitespace-nowrap">
                    {item.label}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white shadow-elevated select-none"
          style={{
            boxShadow: "0 6px 24px rgba(99, 102, 241, 0.4), 0 2px 8px rgba(99, 102, 241, 0.2)",
          }}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
          aria-expanded={isOpen}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
