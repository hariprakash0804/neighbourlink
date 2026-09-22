import {
  Building2,
  Pill,
  Shield,
  Flame,
  Film,
  GraduationCap,
  Landmark,
  CreditCard,
  Newspaper,
  Tv,
  Milk,
  Fuel,
  Droplets,
  Zap,
  Wrench,
  Hammer,
  Wind,
  ChefHat,
  Shirt,
  BookOpen,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

// ─── Essential Service Categories ─────────────────────────────────────────────
export interface CategoryMeta {
  value: string;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

export const ESSENTIAL_CATEGORY_META: CategoryMeta[] = [
  { value: "HOSPITAL",      label: "Hospitals & Clinics", icon: Building2,     description: "Hospitals, clinics, and healthcare centers",    color: "#ef4444" },
  { value: "PHARMACY",      label: "Pharmacies",          icon: Pill,          description: "Medical stores and pharmacies",                 color: "#10b981" },
  { value: "POLICE",        label: "Police Stations",     icon: Shield,        description: "Police stations and help desks",                color: "#3b82f6" },
  { value: "FIRE",          label: "Fire Stations",       icon: Flame,         description: "Fire stations and emergency services",          color: "#f97316" },
  { value: "ENTERTAINMENT", label: "Entertainment",       icon: Film,          description: "Theatres, malls, parks, gyms, cafes",           color: "#8b5cf6" },
  { value: "SCHOOL",        label: "Schools & Tuition",   icon: GraduationCap, description: "Schools, colleges, and coaching centers",        color: "#06b6d4" },
  { value: "ATM",           label: "ATMs",                icon: CreditCard,    description: "ATMs and cash withdrawal points",               color: "#14b8a6" },
  { value: "BANK",          label: "Banks",               icon: Landmark,      description: "Banks and financial institutions",              color: "#6366f1" },
];

// ─── Vendor Categories ────────────────────────────────────────────────────────
export const VENDOR_CATEGORY_META: CategoryMeta[] = [
  { value: "NEWSPAPER",  label: "Newspaper",            icon: Newspaper,       description: "Daily newspaper delivery",                      color: "#78716c" },
  { value: "CABLE_DTH",  label: "Cable TV / DTH",       icon: Tv,              description: "Cable TV and DTH operators",                    color: "#7c3aed" },
  { value: "MILK",       label: "Milk Delivery",         icon: Milk,            description: "Daily milk and dairy delivery",                 color: "#38bdf8" },
  { value: "LPG_GAS",   label: "LPG Gas",               icon: Fuel,            description: "LPG gas agency and refill booking",             color: "#ea580c" },
  { value: "WATER_CAN",  label: "Water Can",            icon: Droplets,        description: "Water can supplier and delivery",               color: "#0ea5e9" },
  { value: "ELECTRICIAN", label: "Electrician",          icon: Zap,             description: "Electrical repair and installation",            color: "#eab308" },
  { value: "PLUMBER",    label: "Plumber",               icon: Wrench,          description: "Plumbing repair and installation",              color: "#2563eb" },
  { value: "CARPENTER",  label: "Carpenter",             icon: Hammer,          description: "Woodwork, furniture repair, and installation",  color: "#a16207" },
  { value: "AC_TECH",    label: "AC Technician",         icon: Wind,            description: "AC servicing, installation, and gas refill",    color: "#0891b2" },
  { value: "MAID_COOK",  label: "Maid / Cook",          icon: ChefHat,         description: "House help, maid, and cook services",           color: "#db2777" },
  { value: "LAUNDRY",    label: "Laundry",               icon: Shirt,           description: "Laundry and dry-cleaning pickup",               color: "#8b5cf6" },
  { value: "TUTOR",      label: "Tutor",                 icon: BookOpen,        description: "Home tuition and coaching",                     color: "#059669" },
  { value: "OTHER",      label: "Other",                 icon: MoreHorizontal,  description: "Other local services",                         color: "#6b7280" },
];

// ─── Badge Tiers ──────────────────────────────────────────────────────────────
export const BADGE_TIER_META = {
  UNVERIFIED:  { label: "Unverified",  color: "#9ca3af", bgColor: "#f3f4f6", description: "Not yet verified" },
  ID_VERIFIED: { label: "ID Verified", color: "#3b82f6", bgColor: "#eff6ff", description: "Identity documents verified by admin" },
  TOP_RATED:   { label: "Top Rated",   color: "#f59e0b", bgColor: "#fffbeb", description: "20+ reviews at 4.5★ or above" },
} as const;

// ─── Radius Options ───────────────────────────────────────────────────────────
export const RADIUS_OPTIONS = [
  { value: 500,  label: "500m" },
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
] as const;

// ─── Emergency Numbers (always visible, never behind auth) ────────────────────
export const EMERGENCY_NUMBERS = [
  { label: "Police",      number: "100",  icon: Shield, color: "#3b82f6" },
  { label: "Ambulance",   number: "108",  icon: Building2, color: "#ef4444" },
  { label: "Fire",        number: "101",  icon: Flame, color: "#f97316" },
  { label: "Women Help",  number: "1091", icon: Shield, color: "#ec4899" },
  { label: "Emergency",   number: "112",  icon: Shield, color: "#dc2626" },
] as const;

// ─── App Constants ────────────────────────────────────────────────────────────
export const APP_NAME = "NeighborLink";
export const APP_TAGLINE = "Your neighborhood, connected";
export const APP_DESCRIPTION =
  "Enter your location once → get a living map of everything and everyone that serves your neighborhood — hospitals, entertainment, local vendors — with verified contact details, in-app booking, and a safe two-sided marketplace.";
