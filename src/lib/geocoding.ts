/**
 * Reverse Geocoding Service — using Nominatim (OpenStreetMap)
 * Free, no API key required. Rate limit: 1 request/second.
 * https://nominatim.org/release-docs/latest/api/Reverse/
 */

export interface GeocodingResult {
  locality: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
  displayName: string;
}

/**
 * Reverse geocode coordinates to an address using Nominatim (OSM)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`,
      {
        headers: {
          "User-Agent": "NeighborLink/1.0 (neighborhood-services-app)",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Nominatim API error: ${res.status}`);
    }

    const data = await res.json();
    const addr = data.address || {};

    return {
      locality:
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.town ||
        addr.city ||
        "Unknown",
      pincode: addr.postcode || "",
      district: addr.county || addr.state_district || "",
      state: addr.state || "",
      country: addr.country || "",
      displayName: data.display_name || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {
      locality: "Unknown",
      pincode: "",
      district: "",
      state: "",
      country: "",
      displayName: "",
    };
  }
}

/**
 * Forward geocode a pincode/locality to coordinates using Nominatim (OSM)
 */
export async function forwardGeocode(
  query: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in&accept-language=en`,
      {
        headers: {
          "User-Agent": "NeighborLink/1.0 (neighborhood-services-app)",
        },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name || "",
    };
  } catch (error) {
    console.error("Forward geocoding error:", error);
    return null;
  }
}
