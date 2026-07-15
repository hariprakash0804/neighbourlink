"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Heart, Shield, Phone, Mail, Send, ArrowRight } from "lucide-react";
import { APP_NAME, EMERGENCY_NUMBERS } from "@/lib/constants";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[var(--app-sidebar-bg)]" role="contentinfo">
      {/* Emergency Numbers — repeated in footer for always-visible requirement */}
      <div className="emergency-strip">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-6 text-xs font-medium">
          {EMERGENCY_NUMBERS.map((item) => (
            <a
              key={`footer-${item.number}`}
              href={`tel:${item.number}`}
              className="flex items-center gap-1.5 transition-colors hover:text-danger"
              style={{ color: item.color }}
              aria-label={`Call ${item.label} at ${item.number}`}
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">{item.label}:</span>
              <span className="font-bold">{item.number}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Newsletter Section */}
        <div className="mb-12 rounded-3xl aurora-bg p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Stay in the Loop
              </h3>
              <p className="text-sm text-white/70 mt-1.5 max-w-sm">
                Get weekly updates about new vendors, community events, and neighborhood happenings.
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex w-full md:w-auto gap-2"
            >
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl bg-white/10 border border-white/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 newsletter-input"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-primary hover:bg-white/90 transition-all shrink-0 shadow-lg"
              >
                {subscribed ? (
                  <span className="text-success">Subscribed! ✓</span>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                {APP_NAME}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your neighborhood, connected. Find essential services, trusted local vendors,
              and everything your community needs — all in one place.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
                aria-label="Twitter / X"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all text-text-muted hover:text-text-primary"
                aria-label="WhatsApp Community"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Essential Services */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Essential Services
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/directory?category=HOSPITAL" className="hover:text-brand-primary transition-colors">Hospitals & Clinics</Link></li>
              <li><Link href="/directory?category=PHARMACY" className="hover:text-brand-primary transition-colors">Pharmacies</Link></li>
              <li><Link href="/directory?category=POLICE" className="hover:text-brand-primary transition-colors">Police Stations</Link></li>
              <li><Link href="/directory?category=ENTERTAINMENT" className="hover:text-brand-primary transition-colors">Entertainment</Link></li>
              <li><Link href="/directory?category=SCHOOL" className="hover:text-brand-primary transition-colors">Schools & Tuition</Link></li>
              <li><Link href="/directory?category=ATM" className="hover:text-brand-primary transition-colors">ATMs & Banks</Link></li>
            </ul>
          </div>

          {/* Local Vendors */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Local Vendors
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/directory?category=ELECTRICIAN" className="hover:text-brand-primary transition-colors">Electricians</Link></li>
              <li><Link href="/directory?category=PLUMBER" className="hover:text-brand-primary transition-colors">Plumbers</Link></li>
              <li><Link href="/directory?category=MILK" className="hover:text-brand-primary transition-colors">Milk Delivery</Link></li>
              <li><Link href="/directory?category=NEWSPAPER" className="hover:text-brand-primary transition-colors">Newspaper</Link></li>
              <li><Link href="/directory?category=MAID_COOK" className="hover:text-brand-primary transition-colors">Maid / Cook</Link></li>
              <li><Link href="/directory?category=LAUNDRY" className="hover:text-brand-primary transition-colors">Laundry</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/vendor/register" className="hover:text-brand-primary transition-colors">Register as Vendor</Link></li>
              <li><Link href="/compare" className="hover:text-brand-primary transition-colors">Compare Vendors</Link></li>
              <li><Link href="/about" className="hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link href="/community" className="hover:text-brand-primary transition-colors">Community Hub</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
            </ul>

            {/* Coming Soon badge */}
            <div className="mt-6 glass rounded-xl p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 shrink-0">
                <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary">Mobile App</p>
                <p className="text-[10px] text-text-muted">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-text-muted">
            Built with <Heart className="h-3 w-3 text-danger fill-danger" /> for neighborhoods
          </p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span>Verified & trusted platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
