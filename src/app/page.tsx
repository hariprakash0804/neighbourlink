"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MapPin,
  ArrowRight,
  Shield,
  Star,
  Users,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  Search,
  TrendingUp,
  Building2,
  Zap,
  Heart,
  Clock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ESSENTIAL_CATEGORY_META, VENDOR_CATEGORY_META, APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ═══ Animated Counter Hook ═══ */
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return { count, ref };
}

/* ═══ Quick Search Chips ═══ */
const QUICK_CHIPS = [
  { label: "🏥 Hospitals", query: "HOSPITAL" },
  { label: "🔧 Plumber", query: "PLUMBER" },
  { label: "⚡ Electrician", query: "ELECTRICIAN" },
  { label: "🥛 Milk Delivery", query: "MILK" },
  { label: "💊 Pharmacy", query: "PHARMACY" },
  { label: "📰 Newspaper", query: "NEWSPAPER" },
  { label: "🍳 Maid / Cook", query: "MAID_COOK" },
  { label: "❄️ AC Repair", query: "AC_TECH" },
];

/* ═══ Testimonials ═══ */
const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Koramangala, Bangalore",
    text: "Found a reliable plumber within minutes! The OTP verification gives me confidence that every vendor is genuine.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    location: "Indiranagar, Bangalore",
    text: "The milk delivery booking feature is a lifesaver. No more calling and waiting — everything is just one tap away.",
    rating: 5,
  },
  {
    name: "Anitha R.",
    location: "HSR Layout, Bangalore",
    text: "As a vendor, NeighborLink helped me reach 200+ new customers in my area. The review system builds real trust.",
    rating: 5,
  },
];

/* ═══ Stats Data ═══ */
const STATS = [
  { value: 5000, suffix: "+", label: "Services Listed", icon: Building2, color: "#6366f1" },
  { value: 3200, suffix: "+", label: "Verified Vendors", icon: Shield, color: "#10b981" },
  { value: 50000, suffix: "+", label: "Happy Residents", icon: Users, color: "#8b5cf6" },
  { value: 12000, suffix: "+", label: "Bookings Made", icon: Calendar, color: "#f59e0b" },
];

/* ═══ Trending Categories ═══ */
const TRENDING = [
  { label: "Electrician", change: "+32%", category: "ELECTRICIAN" },
  { label: "Plumber", change: "+28%", category: "PLUMBER" },
  { label: "AC Technician", change: "+45%", category: "AC_TECH" },
  { label: "Maid / Cook", change: "+19%", category: "MAID_COOK" },
];

export default function HomePage() {
  const router = useRouter();
  const [heroInput, setHeroInput] = useState("");

  const handleExplore = () => {
    const query = heroInput.trim();
    if (query) {
      router.push(`/directory?query=${encodeURIComponent(query)}`);
    } else {
      router.push("/directory");
    }
  };

  const handleHeroKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleExplore();
    }
  };

  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — Aurora gradient mesh background
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Aurora mesh background */}
        <div className="aurora-mesh absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--app-bg)]" />
        </div>

        {/* Floating decorative orbs */}
        <motion.div
          className="absolute top-20 right-[15%] h-72 w-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-[10%] h-48 w-48 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(232,121,249,0.4) 0%, transparent 70%)",
          }}
          animate={{
            y: [0, 15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium mb-6">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                </div>
                <span className="text-text-secondary">Connecting neighborhoods across India</span>
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Neighborhood,{" "}
              <span className="bg-gradient-to-r from-brand-primary via-brand-accent to-aurora-5 bg-clip-text text-transparent">
                Connected
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg text-text-secondary leading-relaxed max-w-2xl"
            >
              {APP_DESCRIPTION}
            </motion.p>

            {/* CTA — Location input */}
            <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary" />
                <input
                  type="text"
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  onKeyDown={handleHeroKeyDown}
                  placeholder="Enter your pincode or locality..."
                  className="w-full rounded-2xl py-4 pl-12 pr-4 text-base glass-strong shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand-primary/40 placeholder:text-text-muted"
                  aria-label="Enter your pincode or locality to explore"
                />
              </div>
              <button
                onClick={handleExplore}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-primary/25 transition-all hover:shadow-xl hover:shadow-brand-primary/30 hover:scale-[1.02] active:scale-[0.98] magnetic-hover"
              >
                <span>Explore</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>

            {/* Quick Search Chips */}
            <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.query}
                  onClick={() => router.push(`/directory?category=${chip.query}`)}
                  className="rounded-full glass px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-6 text-sm text-text-muted"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-verified-blue" />
                <span>OTP-verified vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-top-rated-gold" />
                <span>Real ratings & reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-success" />
                <span>Trusted by communities</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          STATS COUNTER SECTION — Animated Counters
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            const { count, ref } = useCountUp(stat.value);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="glass rounded-2xl p-6 text-center hover-glow"
              >
                <div
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
                <p
                  ref={ref}
                  className="text-2xl font-extrabold stat-counter"
                  style={{ fontFamily: "var(--font-heading)", color: stat.color }}
                >
                  {count.toLocaleString()}{stat.suffix}
                </p>
                <p className="text-xs text-text-muted mt-1 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ESSENTIAL SERVICES — Claymorphic cards
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Essential Services
            </h2>
            <p className="mt-2 text-text-secondary">
              Hospitals, pharmacies, police stations, and more — verified and always accessible.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {ESSENTIAL_CATEGORY_META.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.value}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(`/directory?category=${cat.value}`)}
                  className="clay-card p-5 flex flex-col items-center gap-3 text-center cursor-pointer group"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                    style={{
                      background: `${cat.color}15`,
                    }}
                  >
                    <Icon className="h-7 w-7" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{cat.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          LOCAL VENDORS — Claymorphic cards (the differentiator)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary mb-3">
              <Star className="h-3 w-3" /> THE DIFFERENTIATOR
            </div>
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Local Vendors & Everyday Services
            </h2>
            <p className="mt-2 text-text-secondary max-w-2xl">
              The everyday-life layer most apps miss — newspaper vendors, milk delivery, electricians,
              plumbers, and every recurring service your household depends on.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {VENDOR_CATEGORY_META.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.button
                  key={cat.value}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(`/directory?category=${cat.value}`)}
                  className="clay-card p-4 flex flex-col items-center gap-2.5 text-center cursor-pointer group"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{
                      background: `${cat.color}15`,
                    }}
                  >
                    <Icon className="h-6 w-6" style={{ color: cat.color }} />
                  </div>
                  <p className="text-xs font-semibold">{cat.label}</p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRENDING IN YOUR AREA
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                Trending This Week
              </h2>
              <p className="text-xs text-text-secondary mt-1">Most searched services in your area</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {TRENDING.map((item, i) => (
              <motion.button
                key={item.category}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => router.push(`/directory?category=${item.category}`)}
                className="glass rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all group"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-text-primary">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Searches this week</p>
                </div>
                <span className="text-xs font-extrabold text-success bg-success/10 px-2 py-1 rounded-lg">
                  {item.change}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — Steps
         ═══════════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center mb-14">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              How It Works
            </h2>
            <p className="mt-2 text-text-secondary">Three simple steps to connect with your neighborhood</p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Enter Your Location",
                description: "Share your pincode or allow location access. We'll find everything within your chosen radius.",
                color: "#6366f1",
              },
              {
                step: "02",
                icon: CheckCircle2,
                title: "Browse Verified Services",
                description: "Explore hospitals, vendors, and local services — all OTP-verified with real contact details.",
                color: "#8b5cf6",
              },
              {
                step: "03",
                icon: Calendar,
                title: "Book & Connect",
                description: "Call, chat, or book services directly. Track appointments and rate your experience.",
                color: "#e879f9",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  variants={itemVariants}
                  className="relative clay-card p-8 text-center"
                >
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: item.color }}
                    >
                      {item.step}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: `${item.color}12` }}
                    >
                      <Icon className="h-8 w-8" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES — Contact & Booking layer preview
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Phone,
              title: "Click-to-Call",
              description: "Instant one-tap calling to verified vendors. No hidden numbers — every contact is real.",
              gradient: "from-emerald-500 to-teal-600",
            },
            {
              icon: MessageCircle,
              title: "In-App Chat",
              description: "Message vendors directly. See response times and chat history. WhatsApp fallback always available.",
              gradient: "from-blue-500 to-indigo-600",
            },
            {
              icon: Calendar,
              title: "Easy Booking",
              description: "Pick a time slot, describe your need, and get instant confirmation. Track every booking status.",
              gradient: "from-violet-500 to-purple-600",
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="glass rounded-3xl p-8 transition-all hover:shadow-elevated hover-glow"
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white mb-5",
                  feature.gradient
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIALS — Social Proof
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning mb-3">
              <Heart className="h-3 w-3 fill-warning" /> LOVED BY RESIDENTS
            </div>
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What Our Community Says
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                variants={itemVariants}
                className="glass rounded-3xl p-6 relative overflow-hidden hover-glow"
              >
                {/* Quote mark */}
                <div className="absolute top-3 right-4 text-5xl font-serif text-brand-primary/10 leading-none select-none">
                  &ldquo;
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-6 relative z-10">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-accent text-white text-xs font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {t.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          VENDOR CTA — Register as a vendor
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl aurora-bg p-10 md:p-16 text-white"
        >
          <div className="relative z-10 max-w-xl">
            <h2
              className="text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Are You a Local Vendor?
            </h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Join NeighborLink to reach thousands of residents in your area. Get verified, build trust,
              and grow your business with our booking and review system.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/vendor/register")}
                className="flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-brand-primary shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              >
                <span>Register Now</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-2xl border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/50"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Decorative floating shapes */}
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SAFETY SECTION — Trust & Safety
         ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Safety First, Always
            </h2>
            <p className="mt-2 text-text-secondary max-w-xl mx-auto">
              Every feature is built with your safety in mind. No anonymous vendors, no unverified data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, label: "OTP-Verified Signups", desc: "Both residents and vendors verify via phone OTP" },
              { icon: CheckCircle2, label: "Document Verification", desc: "Admin reviews ID proofs before vendor approval" },
              { icon: Star, label: "Two-Way Ratings", desc: "Residents rate vendors, vendors can flag abuse" },
              { icon: Users, label: "Moderation Queue", desc: "Reports handled with SLA tracking by admins" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={itemVariants}
                  className="glass rounded-2xl p-6 text-center hover-glow"
                >
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
                    <Icon className="h-5 w-5 text-success" />
                  </div>
                  <h4 className="text-sm font-bold mb-1">{item.label}</h4>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
