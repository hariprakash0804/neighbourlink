import { EssentialService } from "./models";

interface SeedService {
  category: "HOSPITAL" | "PHARMACY" | "POLICE" | "FIRE" | "ENTERTAINMENT" | "SCHOOL" | "ATM" | "BANK";
  name: string;
  lat: number;
  lng: number;
  phone: string;
  is24x7: boolean;
  isGovtSource: boolean;
  metadata?: Record<string, any>;
}

// Generate services near Bangalore (lat: 12.9716, lng: 77.5946)
// and Chennai (lat: 13.0827, lng: 80.2707)
const servicesToSeed: SeedService[] = [
  // ─── BANGALORE SERVICES ───
  {
    category: "HOSPITAL",
    name: "St. Martha's Hospital",
    lat: 12.9723,
    lng: 77.5898,
    phone: "080 2222 4561",
    is24x7: true,
    isGovtSource: true,
    metadata: { rating: 4.2, specialty: "General & Trauma", beds: 550 },
  },
  {
    category: "HOSPITAL",
    name: "Fortis Hospital, Cunningham Rd",
    lat: 12.9882,
    lng: 77.5961,
    phone: "080 4199 4444",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 4.6, specialty: "Cardiology", beds: 150 },
  },
  {
    category: "HOSPITAL",
    name: "Mallya Hospital",
    lat: 12.9701,
    lng: 77.5912,
    phone: "080 2227 7979",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 3.9, specialty: "Multi-specialty", beds: 300 },
  },
  {
    category: "PHARMACY",
    name: "Apollo Pharmacy 24/7 - MG Road",
    lat: 12.9741,
    lng: 77.6083,
    phone: "1860 500 0101",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 4.4, delivery: true },
  },
  {
    category: "PHARMACY",
    name: "MedPlus Cunningham Road",
    lat: 12.9891,
    lng: 77.5948,
    phone: "080 2226 2222",
    is24x7: false,
    isGovtSource: false,
    metadata: { rating: 4.3, openHours: "08:00 AM - 11:00 PM" },
  },
  {
    category: "POLICE",
    name: "Cubbon Park Police Station",
    lat: 12.9739,
    lng: 77.5959,
    phone: "080 2294 2581",
    is24x7: true,
    isGovtSource: true,
    metadata: { officerInCharge: "Inspector Kumar", jurisdiction: "Cubbon Park & MG Road" },
  },
  {
    category: "POLICE",
    name: "High Grounds Police Station",
    lat: 12.9912,
    lng: 77.5875,
    phone: "080 2294 2583",
    is24x7: true,
    isGovtSource: true,
  },
  {
    category: "FIRE",
    name: "Ulsoor Fire Station",
    lat: 12.9803,
    lng: 77.6215,
    phone: "080 2297 1550",
    is24x7: true,
    isGovtSource: true,
  },
  {
    category: "ENTERTAINMENT",
    name: "PVR Directors Cut - Forum Rex Walk",
    lat: 12.9735,
    lng: 77.6067,
    phone: "088009 00009",
    is24x7: false,
    isGovtSource: false,
    metadata: { rating: 4.7, type: "Cinema & Dining" },
  },
  {
    category: "ENTERTAINMENT",
    name: "Cubbon Park walking zone",
    lat: 12.9738,
    lng: 77.5915,
    phone: "",
    is24x7: false,
    isGovtSource: true,
    metadata: { rating: 4.8, type: "Public Park", entry: "Free" },
  },
  {
    category: "SCHOOL",
    name: "Bishop Cotton Boys' School",
    lat: 12.9691,
    lng: 77.5997,
    phone: "080 2221 3523",
    is24x7: false,
    isGovtSource: false,
    metadata: { rating: 4.5, board: "ICSE/ISC" },
  },
  {
    category: "SCHOOL",
    name: "St. Joseph's Boys' High School",
    lat: 12.9705,
    lng: 77.6022,
    phone: "080 2221 3340",
    is24x7: false,
    isGovtSource: false,
    metadata: { rating: 4.6, board: "ICSE/State" },
  },
  {
    category: "ATM",
    name: "SBI ATM - Cubbon Road",
    lat: 12.9765,
    lng: 77.5991,
    phone: "",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 4.0, acceptedCards: ["Visa", "Mastercard", "Rupay"] },
  },
  {
    category: "BANK",
    name: "HDFC Bank - Kasturba Road",
    lat: 12.9721,
    lng: 77.5975,
    phone: "022 6160 6161",
    is24x7: false,
    isGovtSource: false,
    metadata: { rating: 4.1, ifsc: "HDFC0000009" },
  },

  // ─── CHENNAI SERVICES ───
  {
    category: "HOSPITAL",
    name: "Rajiv Gandhi Govt General Hospital",
    lat: 13.0818,
    lng: 80.2745,
    phone: "044 2530 5000",
    is24x7: true,
    isGovtSource: true,
    metadata: { rating: 4.1, specialty: "General & Trauma", beds: 2700 },
  },
  {
    category: "HOSPITAL",
    name: "Fortis Malar Hospital, Adyar",
    lat: 13.0121,
    lng: 80.2563,
    phone: "044 4242 4242",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 4.4, specialty: "Multi-specialty", beds: 180 },
  },
  {
    category: "PHARMACY",
    name: "Apollo Pharmacy - Egmore",
    lat: 13.0782,
    lng: 80.2612,
    phone: "044 2819 1234",
    is24x7: true,
    isGovtSource: false,
    metadata: { rating: 4.3 },
  },
  {
    category: "POLICE",
    name: "Flower Bazaar Police Station",
    lat: 13.0935,
    lng: 80.2798,
    phone: "044 2345 2570",
    is24x7: true,
    isGovtSource: true,
  },
  {
    category: "ATM",
    name: "ICICI Bank ATM - Central Railway Station",
    lat: 13.0825,
    lng: 80.2755,
    phone: "",
    is24x7: true,
    isGovtSource: false,
  },
];

/**
 * Seed sample data into the database if the EssentialService table is empty.
 */
export async function seedEssentialServices() {
  try {
    const count = await EssentialService.count();
    if (count > 0) {
      console.log(`ℹ️ EssentialService table already has ${count} records. Skipping seed.`);
      return;
    }

    console.log("🌱 Seeding Essential Services sample data...");
    await EssentialService.bulkCreate(servicesToSeed);
    console.log(`✅ Successfully seeded ${servicesToSeed.length} Essential Services!`);
  } catch (error) {
    console.error("❌ Error seeding Essential Services:", error);
  }
}
