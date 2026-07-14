import Link from "next/link";
import { MapPin, Heart, Shield, Phone } from "lucide-react";
import { APP_NAME, EMERGENCY_NUMBERS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--app-sidebar-bg)]">
      {/* Emergency Numbers — repeated in footer for always-visible requirement */}
      <div className="emergency-strip">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-6 text-xs font-medium">
          {EMERGENCY_NUMBERS.map((item) => (
            <a
              key={`footer-${item.number}`}
              href={`tel:${item.number}`}
              className="flex items-center gap-1.5 transition-colors hover:text-danger"
              style={{ color: item.color }}
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">{item.label}:</span>
              <span className="font-bold">{item.number}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
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
          </div>

          {/* Essential Services */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Essential Services
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/services/hospital" className="hover:text-brand-primary transition-colors">Hospitals & Clinics</Link></li>
              <li><Link href="/services/pharmacy" className="hover:text-brand-primary transition-colors">Pharmacies</Link></li>
              <li><Link href="/services/police" className="hover:text-brand-primary transition-colors">Police Stations</Link></li>
              <li><Link href="/services/entertainment" className="hover:text-brand-primary transition-colors">Entertainment</Link></li>
              <li><Link href="/services/school" className="hover:text-brand-primary transition-colors">Schools & Tuition</Link></li>
              <li><Link href="/services/atm" className="hover:text-brand-primary transition-colors">ATMs & Banks</Link></li>
            </ul>
          </div>

          {/* Local Vendors */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Local Vendors
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/vendors/electrician" className="hover:text-brand-primary transition-colors">Electricians</Link></li>
              <li><Link href="/vendors/plumber" className="hover:text-brand-primary transition-colors">Plumbers</Link></li>
              <li><Link href="/vendors/milk" className="hover:text-brand-primary transition-colors">Milk Delivery</Link></li>
              <li><Link href="/vendors/newspaper" className="hover:text-brand-primary transition-colors">Newspaper</Link></li>
              <li><Link href="/vendors/maid" className="hover:text-brand-primary transition-colors">Maid / Cook</Link></li>
              <li><Link href="/vendors/laundry" className="hover:text-brand-primary transition-colors">Laundry</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-text-secondary">
              <li><Link href="/register-vendor" className="hover:text-brand-primary transition-colors">Register as Vendor</Link></li>
              <li><Link href="/about" className="hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link href="/safety" className="hover:text-brand-primary transition-colors">Safety & Trust</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link></li>
            </ul>
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
