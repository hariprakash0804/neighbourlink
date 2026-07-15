"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Building2,
  ArrowRight,
  MessageSquare,
  Calendar,
  User,
  Heart,
  Shield,
  AlertTriangle,
  Megaphone,
  Settings,
  X,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META } from "@/lib/constants";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ═══ Navigation Items ═══ */
const NAV_ITEMS = [
  { label: "Directory", href: "/directory", icon: Search, group: "Navigate" },
  { label: "Community Hub", href: "/community", icon: Megaphone, group: "Navigate" },
  { label: "Chat Inbox", href: "/chat", icon: MessageSquare, group: "Navigate" },
  { label: "My Bookings", href: "/bookings", icon: Calendar, group: "Navigate" },
  { label: "My Profile", href: "/profile", icon: User, group: "Navigate" },
  { label: "Saved Vendors", href: "/favorites", icon: Heart, group: "Navigate" },
  { label: "Notifications", href: "/notifications", icon: Shield, group: "Navigate" },
  { label: "Compare Vendors", href: "/compare", icon: Building2, group: "Navigate" },
  { label: "About NeighborLink", href: "/about", icon: Building2, group: "Navigate" },
];

const ACTION_ITEMS = [
  { label: "Register as Vendor", href: "/vendor/register", icon: Settings, group: "Actions" },
  { label: "Report a Civic Issue", href: "/community?tab=civic&create=true", icon: AlertTriangle, group: "Actions" },
  { label: "Create a Bulletin Post", href: "/community?tab=bulletin&create=true", icon: Megaphone, group: "Actions" },
];

/* ═══ Recently Searched Helper ═══ */
function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("nl_cmd_recent");
    return stored ? JSON.parse(stored).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentSearches();
    const updated = [query, ...current.filter((q) => q !== query)].slice(0, 5);
    localStorage.setItem("nl_cmd_recent", JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Build filtered results
  const allCategories = useMemo(
    () => [
      ...ESSENTIAL_CATEGORY_META.map((c) => ({
        label: c.label,
        href: `/directory?category=${c.value}`,
        icon: c.icon,
        group: "Services",
        color: c.color,
      })),
      ...VENDOR_CATEGORY_META.map((c) => ({
        label: c.label,
        href: `/directory?category=${c.value}`,
        icon: c.icon,
        group: "Vendors",
        color: c.color,
      })),
    ],
    []
  );

  const filteredResults = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      // Show nav + actions when no query
      return [...NAV_ITEMS.slice(0, 6), ...ACTION_ITEMS];
    }

    const all = [...allCategories, ...NAV_ITEMS, ...ACTION_ITEMS];
    return all.filter((item) => item.label.toLowerCase().includes(lowerQuery)).slice(0, 12);
  }, [query, allCategories]);

  // Group results
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof filteredResults> = {};
    filteredResults.forEach((item) => {
      const group = item.group;
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filteredResults]);

  // Flat list for keyboard navigation
  const flatResults = filteredResults;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (href: string, label: string) => {
      saveRecentSearch(label);
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = flatResults[activeIndex];
        if (selected) {
          handleSelect(selected.href, selected.label);
        } else if (query.trim()) {
          // Search query in directory
          saveRecentSearch(query.trim());
          onClose();
          router.push(`/directory?query=${encodeURIComponent(query.trim())}`);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [activeIndex, flatResults, handleSelect, onClose, query, router]
  );

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 command-palette-backdrop"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 w-full max-w-lg rounded-2xl glass-strong shadow-elevated border border-white/10 overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <Search className="h-5 w-5 text-brand-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search services, navigate, or take action..."
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                aria-label="Command palette search"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-surface-tertiary/50 px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin py-2">
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">
                    Recent
                  </p>
                  {recentSearches.map((recent) => (
                    <button
                      key={recent}
                      onClick={() => {
                        setQuery(recent);
                        inputRef.current?.focus();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-text-secondary hover:bg-white/5 transition-colors"
                    >
                      <Search className="h-3.5 w-3.5 text-text-muted" />
                      <span>{recent}</span>
                    </button>
                  ))}
                  <div className="border-b border-white/5 mt-2" />
                </div>
              )}

              {flatResults.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-text-muted">No results found for &ldquo;{query}&rdquo;</p>
                  <p className="text-[10px] text-text-muted/60 mt-1">
                    Press Enter to search in the directory
                  </p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([group, items]) => (
                  <div key={group} className="px-3 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 py-1.5">
                      {group}
                    </p>
                    {items.map((item) => {
                      const Icon = item.icon;
                      const currentFlatIndex = flatIndex++;
                      const isActive = currentFlatIndex === activeIndex;
                      const color = "color" in item ? (item as any).color : undefined;

                      return (
                        <button
                          key={`${group}-${item.label}`}
                          onClick={() => handleSelect(item.href, item.label)}
                          data-active={isActive ? "true" : "false"}
                          className={cn(
                            "command-palette-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                            isActive
                              ? "text-text-primary"
                              : "text-text-secondary"
                          )}
                        >
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                            style={{
                              backgroundColor: color ? `${color}15` : "rgba(99,102,241,0.08)",
                            }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: color || "var(--color-brand-primary)" }}
                            />
                          </div>
                          <span className="font-medium truncate">{item.label}</span>
                          {isActive && (
                            <div className="ml-auto flex items-center gap-1 text-[10px] text-text-muted">
                              <CornerDownLeft className="h-3 w-3" />
                              <span>Enter</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-surface-secondary/20">
              <div className="flex items-center gap-4 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 px-1 py-0.5 font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 px-1 py-0.5 font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-white/10 px-1 py-0.5 font-mono">esc</kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-text-muted">
                <Command className="h-3 w-3" />
                <span>NeighborLink</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
