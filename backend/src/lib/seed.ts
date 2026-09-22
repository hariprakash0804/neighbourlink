import { EssentialService, User, Vendor } from "./models";
import { initMeilisearch, indexVendors, type MeiliVendorDoc } from "./meilisearch";

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

interface SeedVendor {
  phone: string;
  name: string;
  businessName: string;
  category:
    | "NEWSPAPER"
    | "CABLE_DTH"
    | "MILK"
    | "LPG_GAS"
    | "WATER_CAN"
    | "ELECTRICIAN"
    | "PLUMBER"
    | "CARPENTER"
    | "AC_TECH"
    | "MAID_COOK"
    | "LAUNDRY"
    | "TUTOR"
    | "OTHER";
  description: string;
  lat: number;
  lng: number;
  serviceRadiusM: number;
  priceInfo: Record<string, any>;
  workingHours: Record<string, any>;
  verificationTier: "UNVERIFIED" | "ID_VERIFIED" | "TOP_RATED";
  ratingAvg: number;
  ratingCount: number;
  responseTimeMin: number;
}

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

const vendorsToSeed: SeedVendor[] = [
  // ─── BANGALORE VENDORS ───
  {
    phone: "+919000000001",
    name: "Ramesh Kumar",
    businessName: "Vasanth Nagar News Agency",
    category: "NEWSPAPER",
    description: "Daily door delivery of all major newspapers (Times of India, The Hindu, Deccan Herald). Est. 1998.",
    lat: 12.9731,
    lng: 77.5912,
    serviceRadiusM: 2000,
    priceInfo: { rate: 180, unit: "month", details: "All newspapers subscription" },
    workingHours: { open: "05:00 AM", close: "09:00 AM" },
    verificationTier: "TOP_RATED",
    ratingAvg: 4.8,
    ratingCount: 34,
    responseTimeMin: 15,
  },
  {
    phone: "+919000000002",
    name: "Suresh Milk Dairy",
    businessName: "Nandini Milk Pro Suppliers",
    category: "MILK",
    description: "Fresh Nandini milk (Blue, Orange, Green packets) and curd delivered directly to your doorstep by 6 AM.",
    lat: 12.9705,
    lng: 77.5955,
    serviceRadiusM: 3000,
    priceInfo: { rate: 640, unit: "month", details: "1 packet blue milk daily" },
    workingHours: { open: "04:30 AM", close: "08:00 AM" },
    verificationTier: "ID_VERIFIED",
    ratingAvg: 4.3,
    ratingCount: 18,
    responseTimeMin: 10,
  },
  {
    phone: "+919000000003",
    name: "Karan Sharma",
    businessName: "Sharma & Co Electricals",
    category: "ELECTRICIAN",
    description: "Professional home electrical installations, wiring repair, fan/geyser servicing, and emergency short circuit fixing.",
    lat: 12.9782,
    lng: 77.5985,
    serviceRadiusM: 5000,
    priceInfo: { rate: 250, unit: "hour", details: "Visiting charge extra ₹100" },
    workingHours: { open: "09:00 AM", close: "08:00 PM" },
    verificationTier: "TOP_RATED",
    ratingAvg: 4.7,
    ratingCount: 22,
    responseTimeMin: 20,
  },
  {
    phone: "+919000000004",
    name: "Shiva Plumber",
    businessName: "Shiva Leakage Repair & Plumbing",
    category: "PLUMBER",
    description: "Leaking tap repairs, pipe fittings, bathroom renovation plumbing, and water tank cleaning services.",
    lat: 12.9712,
    lng: 77.5862,
    serviceRadiusM: 4000,
    priceInfo: { rate: 200, unit: "hour" },
    workingHours: { open: "08:00 AM", close: "10:00 PM" },
    verificationTier: "UNVERIFIED",
    ratingAvg: 3.9,
    ratingCount: 9,
    responseTimeMin: 45,
  },
  {
    phone: "+919000000005",
    name: "Cool Air Tech",
    businessName: "Bengaluru AC Installation & Service",
    category: "AC_TECH",
    description: "Air conditioner gas filling, filter cleaning, new unit installations, and split/window AC servicing.",
    lat: 12.9852,
    lng: 77.5991,
    serviceRadiusM: 8000,
    priceInfo: { rate: 450, unit: "visit", details: "Gas charging extra" },
    workingHours: { open: "09:00 AM", close: "07:00 PM" },
    verificationTier: "ID_VERIFIED",
    ratingAvg: 4.2,
    ratingCount: 15,
    responseTimeMin: 30,
  },

  // ─── CHENNAI VENDORS ───
  {
    phone: "+919000000101",
    name: "Pradeep News Agency",
    businessName: "Egmore Daily News Agency",
    category: "NEWSPAPER",
    description: "Daily delivery of The Hindu, Times of India, and Dinakaran in Egmore area.",
    lat: 13.0792,
    lng: 80.2625,
    serviceRadiusM: 2000,
    priceInfo: { rate: 190, unit: "month" },
    workingHours: { open: "05:00 AM", close: "09:00 AM" },
    verificationTier: "TOP_RATED",
    ratingAvg: 4.9,
    ratingCount: 25,
    responseTimeMin: 10,
  },
  {
    phone: "+919000000102",
    name: "Selvam Electrician",
    businessName: "Chennai Sparky Electricals",
    category: "ELECTRICIAN",
    description: "House wiring, switchboard repair, inverter installation, and geyser service. Quick response in Chennai Central.",
    lat: 13.0852,
    lng: 80.2762,
    serviceRadiusM: 4000,
    priceInfo: { rate: 220, unit: "hour" },
    workingHours: { open: "08:00 AM", close: "09:00 PM" },
    verificationTier: "ID_VERIFIED",
    ratingAvg: 4.5,
    ratingCount: 19,
    responseTimeMin: 25,
  },
];

/**
 * Seed all sample data (Essential Services + Users + Vendors) and sync to Meilisearch index.
 */
export async function seedEssentialServices() {
  try {
    // 1. Seed Essential Services
    const serviceCount = await EssentialService.count();
    if (serviceCount === 0) {
      console.log("🌱 Seeding Essential Services sample data...");
      await EssentialService.bulkCreate(servicesToSeed);
      console.log(`✅ Successfully seeded ${servicesToSeed.length} Essential Services!`);
    } else {
      console.log(`ℹ️ EssentialService table already has ${serviceCount} records. Skipping seed.`);
    }

    // 2. Seed Vendors & Users
    const vendorCount = await Vendor.count();
    if (vendorCount === 0) {
      console.log("🌱 Seeding Vendor & User profiles...");
      
      for (const item of vendorsToSeed) {
        // Create user first (role VENDOR)
        const user = await User.create({
          phone: item.phone,
          name: item.name,
          role: "VENDOR",
        });

        // Create vendor
        await Vendor.create({
          userId: user.id,
          category: item.category,
          businessName: item.businessName,
          description: item.description,
          lat: item.lat,
          lng: item.lng,
          serviceRadiusM: item.serviceRadiusM,
          priceInfo: item.priceInfo,
          workingHours: item.workingHours,
          verificationTier: item.verificationTier,
          ratingAvg: item.ratingAvg,
          ratingCount: item.ratingCount,
          responseTimeMin: item.responseTimeMin,
        });
      }

      console.log(`✅ Successfully seeded ${vendorsToSeed.length} Vendors & User accounts!`);
    } else {
      console.log(`ℹ️ Vendor table already has ${vendorCount} records. Skipping seed.`);
    }

    // 3. Sync all seeded Vendors to Meilisearch Index
    const allVendors = await Vendor.findAll();
    if (allVendors.length > 0) {
      console.log("🔄 Syncing seeded vendors to Meilisearch index...");
      await initMeilisearch();

      const meiliDocs: MeiliVendorDoc[] = allVendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        description: v.description,
        category: v.category,
        verificationTier: v.verificationTier,
        ratingAvg: v.ratingAvg,
        ratingCount: v.ratingCount,
        _geo: {
          lat: v.lat,
          lng: v.lng,
        },
      }));

      await indexVendors(meiliDocs);
      console.log("✅ Seeded vendors successfully indexed in Meilisearch");
    }

  } catch (error) {
    console.error("❌ Error during database seeding & Meilisearch sync:", error);
  }
}
