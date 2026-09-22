/**
 * Server-side constants.
 * UI-specific constants (icons, colors, CategoryMeta) live in frontend/src/lib/constants.ts
 */

// ─── App Constants ────────────────────────────────────────────────────────
export const APP_NAME = "NeighborLink";
export const APP_TAGLINE = "Your neighborhood, connected";
export const APP_DESCRIPTION =
  "Enter your location once → get a living map of everything and everyone that serves your neighborhood — hospitals, entertainment, local vendors — with verified contact details, in-app booking, and a safe two-sided marketplace.";

// ─── Radius Options ───────────────────────────────────────────────────────
export const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1 km" },
  { value: 3000, label: "3 km" },
  { value: 5000, label: "5 km" },
] as const;

// ─── Emergency Numbers ────────────────────────────────────────────────────
export const EMERGENCY_NUMBERS = [
  { label: "Police", number: "100" },
  { label: "Ambulance", number: "108" },
  { label: "Fire", number: "101" },
  { label: "Women Help", number: "1091" },
  { label: "Emergency", number: "112" },
] as const;
