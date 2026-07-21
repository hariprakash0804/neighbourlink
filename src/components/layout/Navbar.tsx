"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Phone,
  LogIn,
  LogOut,
  User,
  Settings,
  CalendarDays,
  MessageSquare,
  Bell,
  Heart,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EMERGENCY_NUMBERS, APP_NAME } from "@/lib/constants";
import { AuthModal } from "@/components/auth/AuthModal";
import { LocationModal } from "@/components/location/LocationModal";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { trpc } from "@/lib/trpc";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    locality: string;
    pincode: string;
  } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [hasPromptedLocation, setHasPromptedLocation] = useState(false);

  const isAuthenticated = status === "authenticated" && session?.user;

  // Unread notifications query
  const { data: unreadData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!isAuthenticated,
    refetchInterval: 15000, // Refetch every 15 seconds to stay updated
  });

  // Load user's default saved address if authenticated
  const { data: addresses, isSuccess: isAddressesLoaded } = trpc.location.getAddresses.useQuery(undefined, {
    enabled: !!isAuthenticated,
  });

  // Listen for global location changes
  useEffect(() => {
    const handleLocationChange = () => {
      const saved = localStorage.getItem("active_location");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentLocation({
            locality: parsed.locality,
            pincode: parsed.pincode || "",
          });
        } catch (e) {
          console.error("Failed to parse active_location:", e);
        }
      } else {
        setCurrentLocation(null);
      }
    };

    window.addEventListener("active_location_changed", handleLocationChange);
    handleLocationChange(); // Run initial check on mount

    return () => window.removeEventListener("active_location_changed", handleLocationChange);
  }, []);

  // Sync saved addresses from DB to active_location in localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("active_location");
      window.dispatchEvent(new Event("active_location_changed"));
      setHasPromptedLocation(false);
      return;
    }

    if (isAddressesLoaded && addresses) {
      const saved = localStorage.getItem("active_location");
      if (addresses.length > 0) {
        if (!saved) {
          // If no active location stored in local storage, use the first saved address
          const latestAddr = addresses[0];
          const newLoc = {
            lat: latestAddr.lat,
            lng: latestAddr.lng,
            locality: latestAddr.label,
            pincode: latestAddr.pincode || "",
          };
          localStorage.setItem("active_location", JSON.stringify(newLoc));
          window.dispatchEvent(new Event("active_location_changed"));
        }
      } else if (!saved && !hasPromptedLocation) {
        // Prompt only if guest/user has NO saved addresses and NO local storage location set
        setHasPromptedLocation(true);
        setIsLocationModalOpen(true);
      }
    }
  }, [isAuthenticated, isAddressesLoaded, addresses, hasPromptedLocation]);

  // Refs for click-outside detection
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

  // Close profile dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut for Command Palette
  useEffect(() => {
    function handleCmdK(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleCmdK);
    return () => document.removeEventListener("keydown", handleCmdK);
  }, []);



  // Handle search submission
  const handleSearch = useCallback(
    (e: React.FormEvent | React.KeyboardEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/directory?query=${encodeURIComponent(searchQuery.trim())}`);
        setIsMobileMenuOpen(false);
      }
    },
    [searchQuery, router]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-primary focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Emergency Numbers Strip — always visible, never behind auth */}
      <div className="emergency-strip" role="banner" aria-label="Emergency contact numbers">
        <div className="mx-auto max-w-7xl px-4 py-1.5 overflow-hidden">
          <div className="flex items-center justify-center gap-6 text-xs font-medium emergency-strip-inner whitespace-nowrap">
            {EMERGENCY_NUMBERS.map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className="flex items-center gap-1.5 transition-colors hover:text-danger shrink-0"
                style={{ color: item.color }}
                aria-label={`Call ${item.label} at ${item.number}`}
              >
                <Phone className="h-3 w-3" />
                <span>{item.label}:</span>
                <span className="font-bold">{item.number}</span>
              </a>
            ))}
            {/* Duplicate for seamless marquee on mobile */}
            {EMERGENCY_NUMBERS.map((item) => (
              <a
                key={`dup-${item.number}`}
                href={`tel:${item.number}`}
                className="flex items-center gap-1.5 transition-colors hover:text-danger shrink-0 sm:hidden"
                style={{ color: item.color }}
                aria-label={`Call ${item.label} at ${item.number}`}
              >
                <Phone className="h-3 w-3" />
                <span>{item.label}:</span>
                <span className="font-bold">{item.number}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar — Glassmorphism */}
      <header className="sticky top-0 z-[1001] glass-strong" role="navigation" aria-label="Main navigation">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label={`${APP_NAME} — go to homepage`}>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-white dark:border-surface-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
                {APP_NAME}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { href: "/directory", label: "Directory" },
                { href: "/community", label: "Community Hub" },
                { href: "/compare", label: "Compare" },
                { href: "/about", label: "About" },
              ].map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-1.5 text-xs font-bold rounded-full transition-all",
                      isActive
                        ? "text-brand-primary bg-brand-primary/5"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-brand-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Location Switcher — Glass dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setIsLocationModalOpen(true);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm glass transition-all hover:scale-[1.02]"
                aria-label="Change location"
              >
                <MapPin className="h-4 w-4 text-brand-primary" />
                <span className="text-text-secondary max-w-[160px] truncate">
                  {currentLocation
                    ? `${currentLocation.locality}${currentLocation.pincode ? ` (${currentLocation.pincode})` : ""}`
                    : "Select Location"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search services, vendors, places..."
                  className="w-full rounded-full py-2.5 pl-10 pr-12 text-sm glass transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder:text-text-muted"
                  aria-label="Search services and vendors"
                />
                <kbd
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-white/10 bg-surface-tertiary/50 px-1.5 py-0.5 text-[10px] font-mono text-text-muted cursor-pointer hover:bg-white/10 transition-colors"
                >
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle — Neumorphic */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="neu-button flex h-10 w-10 items-center justify-center"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {mounted ? (
                  <AnimatePresence mode="wait">
                    {theme === "dark" ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="h-4.5 w-4.5 text-warning" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="h-4.5 w-4.5 text-brand-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  <Sun className="h-4.5 w-4.5 text-text-muted" />
                )}
              </button>

              {/* Notification Bell (authenticated only) */}
              {isAuthenticated && (
                <Link
                  href="/notifications"
                  className="neu-button flex h-10 w-10 items-center justify-center relative"
                  aria-label="View notifications"
                >
                  <Bell className="h-4.5 w-4.5 text-text-secondary" />
                  {unreadData && unreadData.count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white shadow-sm">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 badge-pulse" />
                      <span className="relative">{unreadData.count}</span>
                    </span>
                  )}
                </Link>
              )}

              {/* Auth / Profile */}
              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full glass px-3 py-2 transition-all hover:scale-[1.02]"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                    id="profile-menu-button"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white text-xs font-bold">
                      {session.user.name
                        ? session.user.name.charAt(0).toUpperCase()
                        : session.user.phone?.slice(-2) || "U"}
                    </div>
                    <span className="hidden sm:block text-sm font-medium max-w-[100px] truncate">
                      {session.user.name || session.user.phone}
                    </span>
                    <ChevronDown className={cn(
                      "h-3 w-3 text-text-muted transition-transform",
                      isProfileOpen && "rotate-180"
                    )} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-56 rounded-2xl glass-strong shadow-elevated z-50 overflow-hidden"
                        role="menu"
                        aria-labelledby="profile-menu-button"
                      >
                        {/* Profile header */}
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-semibold truncate">
                            {session.user.name || "NeighborLink User"}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {session.user.phone}
                          </p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors font-semibold border-b border-white/5"
                            role="menuitem"
                          >
                            <User className="h-4 w-4 text-brand-primary" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href={session.user.role === "VENDOR" ? "/vendor/dashboard" : "/bookings"}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {session.user.role === "VENDOR" ? "Vendor Dashboard" : "My Bookings"}
                            </span>
                          </Link>
                          <Link
                            href="/favorites"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <Heart className="h-4 w-4" />
                            <span>Saved Vendors</span>
                          </Link>
                          <Link
                            href="/notifications"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <Bell className="h-4 w-4" />
                            <span>Notifications</span>
                          </Link>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsLocationModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>My Addresses</span>
                          </button>
                          <Link
                            href="/community"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <MessageSquare className="h-4 w-4 text-brand-primary" />
                            <span>Community Hub</span>
                          </Link>
                          <Link
                            href="/chat"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                            role="menuitem"
                          >
                            <MessageSquare className="h-4 w-4 text-brand-primary" />
                            <span>Chat Inbox</span>
                          </Link>
                          {session.user.role !== "VENDOR" && session.user.role !== "ADMIN" && (
                            <Link
                              href="/vendor/register"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-primary hover:bg-white/5 transition-colors font-semibold"
                              role="menuitem"
                            >
                              <Settings className="h-4 w-4" />
                              <span>Register as Vendor</span>
                            </Link>
                          )}
                          {session.user.role === "ADMIN" && (
                            <Link
                              href="/admin/vendors"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-accent hover:bg-white/5 transition-colors font-semibold"
                              role="menuitem"
                            >
                              <Shield className="h-4 w-4 text-brand-accent" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-white/5 py-1">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              signOut();
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-primary to-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all hover:shadow-xl hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl glass"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu — Slide down */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-3">
                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search services, vendors..."
                    className="w-full rounded-xl py-3 pl-10 pr-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    aria-label="Search services and vendors"
                  />
                </div>

                {/* Mobile Navigation Links */}
                <div className="flex flex-col gap-1">
                  {[
                    { href: "/directory", icon: Search, label: "Directory" },
                    { href: "/community", icon: MessageSquare, label: "Community Hub" },
                    { href: "/compare", icon: Settings, label: "Compare Vendors" },
                    { href: "/about", icon: User, label: "About" },
                  ].map((link) => {
                    const LinkIcon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                          isActive
                            ? "text-brand-primary bg-brand-primary/5 font-bold"
                            : "text-text-secondary hover:bg-white/5"
                        )}
                      >
                        <LinkIcon className={cn("h-4 w-4", isActive ? "text-brand-primary" : "text-brand-primary")} />
                        {link.label}
                        {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile Location */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isAuthenticated) {
                      setIsLocationModalOpen(true);
                    } else {
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 glass"
                >
                  <MapPin className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm">
                    {currentLocation ? currentLocation.locality : "Select Location"}
                  </span>
                </button>

                {/* Mobile Auth */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white text-xs font-bold">
                        {session.user.name
                          ? session.user.name.charAt(0).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{session.user.name || "User"}</p>
                        <p className="text-xs text-text-muted">{session.user.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 px-5 py-3 text-sm font-medium text-danger"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-accent px-5 py-3 text-sm font-semibold text-white"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSet={(loc) => {
          const newLoc = {
            lat: loc.lat,
            lng: loc.lng,
            locality: loc.locality,
            pincode: loc.pincode || "",
          };
          localStorage.setItem("active_location", JSON.stringify(newLoc));
          window.dispatchEvent(new Event("active_location_changed"));
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
