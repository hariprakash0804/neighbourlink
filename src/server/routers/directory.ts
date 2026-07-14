import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { EssentialService } from "@/lib/models";
import { haversineDistance } from "@/lib/utils";
import { Op } from "sequelize";

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
   * Search vendors by category + free-text query (Meilisearch-backed)
   * Implementation: Phase 3
   */
  searchVendors: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        lat: z.number(),
        lng: z.number(),
        radius: z.number().min(500).max(10000).default(3000),
        query: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // TODO: Phase 3 — Meilisearch full-text search + geo filter
      return { vendors: [], total: 0 };
    }),
});
