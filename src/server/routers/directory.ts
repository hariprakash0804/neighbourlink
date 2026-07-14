import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { EssentialService, User, Vendor } from "@/lib/models";
import { haversineDistance } from "@/lib/utils";
import { Op } from "sequelize";
import { getMeiliClient } from "@/lib/meilisearch";
import { checkRateLimit } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";

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

  /**
   * Get a single vendor by ID (for detail page)
   * Implementation: Phase 6
   */
  getVendorById: publicProcedure
    .input(z.object({ vendorId: z.string() }))
    .query(async ({ input }) => {
      const vendor = await Vendor.findByPk(input.vendorId, {
        include: [{ model: User, as: "user", attributes: ["phone", "name"] }],
      });

      if (!vendor) {
        return { vendor: null };
      }

      return {
        vendor: {
          id: vendor.id,
          userId: vendor.userId,
          category: vendor.category,
          businessName: vendor.businessName,
          description: vendor.description,
          lat: vendor.lat,
          lng: vendor.lng,
          serviceRadiusM: vendor.serviceRadiusM,
          priceInfo: vendor.priceInfo,
          workingHours: vendor.workingHours,
          verificationTier: vendor.verificationTier,
          ratingAvg: vendor.ratingAvg,
          ratingCount: vendor.ratingCount,
          responseTimeMin: vendor.responseTimeMin,
          phone: vendor.user?.phone || null,
        },
      };
    }),

  /**
   * Reveal the contact phone number of a vendor or service with rate-limiting (10 reveals per hour per user)
   * Implementation: Phase 7
   */
  revealContact: protectedProcedure
    .input(
      z.object({
        targetId: z.string(),
        targetType: z.enum(["VENDOR", "ESSENTIAL"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Rate limit check: 10 reveals per hour (3600 seconds)
      const rateLimitKey = `rate:reveal:${userId}`;
      const limitResult = await checkRateLimit(rateLimitKey, 10, 3600);
      if (!limitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You have exceeded the contact reveal limit. Please wait an hour before revealing contact info again.",
        });
      }

      let phone: string | null = null;

      if (input.targetType === "VENDOR") {
        const vendor = await Vendor.findByPk(input.targetId, {
          include: [{ model: User, as: "user", attributes: ["phone"] }],
        });
        phone = vendor?.user?.phone || null;
      } else {
        const service = await EssentialService.findByPk(input.targetId);
        phone = service?.phone || null;
      }

      if (!phone) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contact details not found" });
      }

      return { phone };
    }),
});
