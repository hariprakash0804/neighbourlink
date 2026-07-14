import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { EssentialService, User, Vendor } from "@/lib/models";
import { haversineDistance } from "@/lib/utils";
import { Op } from "sequelize";
import { getMeiliClient } from "@/lib/meilisearch";

export const directoryRouter = router({
  /**
   * Search essential services by category near a location
   * Implementation: Phase 2
   */
  searchEssentialServices: publicProcedure
    .input(
      z.object({
        category: z.string(),
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(20000).default(3000), // radius in meters
      })
    )
    .query(async ({ input }) => {
      const { category, lat, lng, radius } = input;

      // Approximate degree offsets (bounding box query)
      const latDelta = radius / 111000;
      const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      // Query database within bounding box
      const services = await EssentialService.findAll({
        where: {
          category,
          lat: { [Op.between]: [minLat, maxLat] },
          lng: { [Op.between]: [minLng, maxLng] },
        },
      });

      // Calculate precise distance and filter
      const servicesWithDistance = services
        .map((service) => {
          const distance = haversineDistance(lat, lng, service.lat, service.lng);
          return {
            id: service.id,
            category: service.category,
            name: service.name,
            lat: service.lat,
            lng: service.lng,
            phone: service.phone,
            is24x7: service.is24x7,
            isGovtSource: service.isGovtSource,
            metadata: service.metadata,
            distance, // distance in meters
          };
        })
        .filter((service) => service.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return {
        services: servicesWithDistance,
        total: servicesWithDistance.length,
      };
    }),

  /**
   * Search vendors by category + free-text query (Meilisearch-backed with SQL fallback)
   * Implementation: Phase 3
   */
  searchVendors: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(20000).default(3000),
        query: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { category, lat, lng, radius, query = "" } = input;
      const meili = getMeiliClient();

      if (meili) {
        try {
          const index = meili.index("vendors");

          // Build filter string
          // Filter within geo radius: _geoRadius(lat, lng, radiusInMeters)
          const filterParts = [`_geoRadius(${lat}, ${lng}, ${radius})`];
          if (category) {
            filterParts.push(`category = "${category}"`);
          }

          // Search Meilisearch
          const searchResult = await index.search(query, {
            filter: filterParts.join(" AND "),
            sort: [`_geoPoint(${lat}, ${lng}):asc`],
            limit: 50,
          });

          // Fetch phone numbers from DB for the hits (Meilisearch doesn't store raw user tables)
          const vendorIds = searchResult.hits.map((h) => h.id);
          const dbVendors = await Vendor.findAll({
            where: { id: { [Op.in]: vendorIds } },
            include: [{ model: User, as: "user", attributes: ["phone", "name"] }],
          });

          // Map back to output format preserving Meilisearch sort order
          const vendors = searchResult.hits
            .map((hit) => {
              const dbVendor = dbVendors.find((dv) => dv.id === hit.id);
              if (!dbVendor) return null;

              const distance = haversineDistance(lat, lng, dbVendor.lat, dbVendor.lng);

              return {
                id: dbVendor.id,
                userId: dbVendor.userId,
                category: dbVendor.category,
                businessName: dbVendor.businessName,
                description: dbVendor.description,
                lat: dbVendor.lat,
                lng: dbVendor.lng,
                serviceRadiusM: dbVendor.serviceRadiusM,
                priceInfo: dbVendor.priceInfo,
                workingHours: dbVendor.workingHours,
                verificationTier: dbVendor.verificationTier,
                ratingAvg: dbVendor.ratingAvg,
                ratingCount: dbVendor.ratingCount,
                responseTimeMin: dbVendor.responseTimeMin,
                phone: dbVendor.user?.phone || null,
                distance,
              };
            })
            .filter((v): v is NonNullable<typeof v> => v !== null);

          return {
            vendors,
            total: vendors.length,
            provider: "meilisearch",
          };
        } catch (meiliError) {
          console.warn("⚠️ Meilisearch query failed, falling back to SQL search:", meiliError);
        }
      }

      // ─── SQL FALLBACK SEARCH ───
      console.log("ℹ️ Executing SQL Fallback query for searchVendors...");
      
      const latDelta = radius / 111000;
      const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      const whereClause: any = {
        lat: { [Op.between]: [minLat, maxLat] },
        lng: { [Op.between]: [minLng, maxLng] },
      };

      if (category) {
        whereClause.category = category;
      }

      if (query.trim()) {
        whereClause[Op.or] = [
          { businessName: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ];
      }

      const dbVendors = await Vendor.findAll({
        where: whereClause,
        include: [{ model: User, as: "user", attributes: ["phone", "name"] }],
      });

      const vendorsWithDistance = dbVendors
        .map((v) => {
          const distance = haversineDistance(lat, lng, v.lat, v.lng);
          return {
            id: v.id,
            userId: v.userId,
            category: v.category,
            businessName: v.businessName,
            description: v.description,
            lat: v.lat,
            lng: v.lng,
            serviceRadiusM: v.serviceRadiusM,
            priceInfo: v.priceInfo as any,
            workingHours: v.workingHours as any,
            verificationTier: v.verificationTier,
            ratingAvg: v.ratingAvg,
            ratingCount: v.ratingCount,
            responseTimeMin: v.responseTimeMin,
            phone: v.user?.phone || null,
            distance,
          };
        })
        .filter((v) => v.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return {
        vendors: vendorsWithDistance,
        total: vendorsWithDistance.length,
        provider: "database",
      };
    }),
});
