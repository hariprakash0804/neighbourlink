"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Heart,
  Shield,
  Users,
  Zap,
  Award,
  Target,
  Globe,
  Phone,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stats = [
  { value: "50+", label: "Service Categories", icon: Target },
  { value: "1000+", label: "Verified Vendors", icon: Award },
  { value: "10k+", label: "Households Served", icon: Users },
  { value: "100+", label: "Pin Codes Covered", icon: Globe },
];

const values = [
  {
    icon: Shield,
    title: "Trust & Safety",
    description:
      "Every vendor goes through verification. Our content moderation and reporting system keeps the community safe.",
    color: "#10b981",
  },
  {
    icon: MapPin,
    title: "Hyperlocal Focus",
    description:
      "We believe great services start close to home. Our geo-radius search ensures you find the nearest, most relevant vendors.",
    color: "#6366f1",
  },
  {
    icon: Heart,
    title: "Community First",
    description:
      "From bulletin boards and local events to civic issue reporting, we empower neighborhoods to connect and act together.",
    color: "#f43f5e",
  },
  {
    icon: Zap,
    title: "Instant Access",
    description:
      "One-tap calling, WhatsApp messaging, and real-time booking — no friction between you and the services you need.",
    color: "#f59e0b",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-24 page-enter">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5" />
        <div className="aurora-bg absolute inset-0 opacity-20" />

        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-bold text-brand-primary mb-6">
              <MapPin className="h-3.5 w-3.5" />
              About {APP_NAME}
            </div>

            <h1
              className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your Neighborhood,{" "}
              <span className="gradient-text">Connected</span>
            </h1>

            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {APP_NAME} is India&apos;s hyperlocal community platform — connecting
              you with essential services, trusted local vendors, and your neighbors.
              Built for every pin code, every street, every home.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 -mt-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="clay-card p-5 text-center hover:shadow-elevated transition-all"
              >
                <Icon className="h-6 w-6 text-brand-primary mx-auto mb-3" />
                <p
                  className="text-2xl font-black gradient-text mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-text-muted font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 md:p-12 text-center"
        >
          <h2
            className="text-2xl md:text-3xl font-black mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Our Mission
          </h2>
          <p className="text-text-secondary leading-relaxed max-w-2xl mx-auto text-base">
            To bridge the gap between neighborhoods and the essential services they
            depend on every day. We believe every electrician, plumber, milk vendor,
            and local shop deserves a digital presence — and every resident deserves
            instant access to trusted help, right in their locality.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2
            className="text-2xl font-black"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            What We Stand For
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 gap-5"
        >
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="clay-card p-6 flex items-start gap-4 hover:shadow-elevated transition-all hover-glow"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                  style={{ background: `${item.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <div>
                  <h3
                    className="text-sm font-bold mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-accent" />
          <div className="absolute inset-0 aurora-bg opacity-30" />
          <div className="relative px-8 py-12 text-center text-white">
            <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Join Your Neighborhood
            </h2>
            <p className="text-sm text-white/80 mb-6 max-w-md mx-auto">
              Whether you&apos;re looking for services or offering them — {APP_NAME} is your community platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/directory"
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand-primary shadow-lg hover:scale-[1.02] transition-all"
              >
                Explore Directory
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vendor/register"
                className="flex items-center gap-2 rounded-2xl border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                Register as Vendor
              </Link>
            </div>
            <div className="mt-8 flex justify-center items-center gap-2 text-xs text-white/70">
              <Phone className="h-3.5 w-3.5" />
              <span>Questions? Contact support at <a href="mailto:support@neighborlink.in" className="underline hover:text-white transition-colors">support@neighborlink.in</a></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
