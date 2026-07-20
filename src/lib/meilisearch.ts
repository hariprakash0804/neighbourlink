import { Meilisearch } from "meilisearch";

const host = process.env.MEILISEARCH_HOST || "http://localhost:7700";
const apiKey = process.env.MEILISEARCH_API_KEY || "";

let client: Meilisearch | null = null;

// Initialize client lazily to avoid connection attempts during static analysis/build
export function getMeiliClient(): Meilisearch | null {
  const meiliHost = process.env.MEILISEARCH_HOST;
  if (!meiliHost || meiliHost === "" || (process.env.NODE_ENV === "production" && meiliHost.includes("localhost"))) {
    return null;
  }
  if (!client) {
    client = new Meilisearch({ host: meiliHost, apiKey });
  }
  return client;
}

export interface MeiliVendorDoc {
  id: string;
  businessName: string;
  description: string | null;
  category: string;
  verificationTier: string;
  ratingAvg: number;
  ratingCount: number;
  _geo: {
    lat: number;
    lng: number;
  };
}

/**
 * Initialize Meilisearch index configuration (run once at startup/seed).
 * Sets searchable fields and filterable attributes (like category and geo location).
 */
export async function initMeilisearch() {
  const meili = getMeiliClient();
  if (!meili) {
    console.log("ℹ️ Meilisearch host not configured. Skipping initialization.");
    return;
  }

  try {
    console.log("🔍 Initializing Meilisearch index 'vendors'...");
    
    // Create/get index
    const index = meili.index("vendors");

    // Configure settings
    await index.updateSettings({
      searchableAttributes: ["businessName", "description", "category"],
      filterableAttributes: ["category", "_geo"],
      sortableAttributes: ["_geo", "ratingAvg"],
    });

    console.log("✅ Meilisearch 'vendors' index configured successfully");
  } catch (error) {
    console.error("⚠️ Failed to initialize Meilisearch index. Make sure Meilisearch is running.", error);
  }
}

/**
 * Upload or update vendor records in Meilisearch
 */
export async function indexVendors(vendors: MeiliVendorDoc[]) {
  const meili = getMeiliClient();
  if (!meili) return;

  try {
    const index = meili.index("vendors");
    const response = await index.addDocuments(vendors);
    console.log(`✅ Indexed ${vendors.length} vendors in Meilisearch. Task UID: ${response.taskUid}`);
  } catch (error) {
    console.error("❌ Failed to index documents in Meilisearch:", error);
  }
}

/**
 * Remove a vendor document from Meilisearch
 */
export async function deleteVendorFromIndex(vendorId: string) {
  const meili = getMeiliClient();
  if (!meili) return;

  try {
    const index = meili.index("vendors");
    await index.deleteDocument(vendorId);
    console.log(`✅ Deleted vendor ${vendorId} from Meilisearch index`);
  } catch (error) {
    console.error(`❌ Failed to delete vendor ${vendorId} from Meilisearch:`, error);
  }
}
