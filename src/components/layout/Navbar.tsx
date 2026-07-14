"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EMERGENCY_NUMBERS, APP_NAME } from "@/lib/constants";
import { AuthModal } from "@/components/auth/AuthModal";
import { LocationModal } from "@/components/location/LocationModal";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    locality: string;
    pincode: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <>
      {/* Emergency Numbers Strip — always visible, never behind auth */}
      <div className="emergency-strip">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-center gap-6 text-xs font-medium">
          {EMERGENCY_NUMBERS.map((item) => (
            <a
              key={item.number}
              href={`tel:${item.number}`}
              className="flex items-center gap-1.5 transition-colors hover:text-danger"
              style={{ color: item.color }}
            >
              <Phone className="h-3 w-3" />
              <span>{item.label}:</span>
              <span className="font-bold">{item.number}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Main Navbar — Glassmorphism */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
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
              <Link
                href="/directory"
                className="px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-full transition-all"
              >
                Directory
              </Link>
              <Link
                href="/community"
                className="px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-full transition-all"
              >
                Community Hub
              </Link>
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
                  placeholder="Search services, vendors, places..."
                  className="w-full rounded-full py-2.5 pl-10 pr-4 text-sm glass transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/30 placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle — Neumorphic */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="neu-button flex h-10 w-10 items-center justify-center"
                aria-label="Toggle dark mode"
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

              {/* Auth / Profile */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full glass px-3 py-2 transition-all hover:scale-[1.02]"
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
                          >
                            <User className="h-4 w-4 text-brand-primary" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href={session.user.role === "VENDOR" ? "/vendor/dashboard" : "/bookings"}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                          >
                            <User className="h-4 w-4" />
                            <span>
                              {session.user.role === "VENDOR" ? "Vendor Dashboard" : "My Bookings"}
                            </span>
                          </Link>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              setIsLocationModalOpen(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>My Addresses</span>
                          </button>
                          <Link
                            href="/community"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 text-brand-primary" />
                            <span>Community Hub</span>
                          </Link>
                          <Link
                            href="/chat"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors"
                          >
                            <MessageSquare className="h-4 w-4 text-brand-primary" />
                            <span>Chat Inbox</span>
                          </Link>
                          {session.user.role !== "VENDOR" && (
                            <Link
                              href="/vendor/register"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-brand-primary hover:bg-white/5 transition-colors font-semibold"
                            >
                              <Settings className="h-4 w-4" />
                              <span>Register as Vendor</span>
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
                    placeholder="Search services, vendors..."
                    className="w-full rounded-xl py-3 pl-10 pr-4 text-sm glass focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
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
          // Open location modal after sign in if no location set
          if (!currentLocation) {
            setTimeout(() => setIsLocationModalOpen(true), 500);
          }
        }}
      />

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSet={(loc) => {
          setCurrentLocation({ locality: loc.locality, pincode: loc.pincode });
        }}
      />
    </>
  );
}
