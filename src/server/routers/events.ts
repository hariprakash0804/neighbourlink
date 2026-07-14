import { router, protectedProcedure, publicProcedure } from "../trpc";
import { z } from "zod";
import { LocalEvent, User, EVENT_CATEGORIES } from "@/lib/models";
import { TRPCError } from "@trpc/server";
import { Op } from "sequelize";

export const eventsRouter = router({
  /**
   * Create a local event
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().min(5).max(5000),
        venue: z.string().min(2).max(255),
        lat: z.number().optional(),
        lng: z.number().optional(),
        startDate: z.string(), // ISO date string
        endDate: z.string().optional(),
        category: z.enum(EVENT_CATEGORIES as unknown as [string, ...string[]]),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const event = await LocalEvent.create({
        userId,
        title: input.title,
        description: input.description,
        venue: input.venue,
        lat: input.lat || null,
        lng: input.lng || null,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        category: input.category as any,
        photoUrl: input.photoUrl || null,
      });

      return { success: true, eventId: event.id };
    }),

  /**
   * List upcoming local events
   */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {
        startDate: { [Op.gte]: new Date() }, // Only upcoming events
      };
      if (input.category) where.category = input.category;

      const offset = (input.page - 1) * input.limit;
      const { rows, count } = await LocalEvent.findAndCountAll({
        where,
        include: [
          { model: User, as: "author", attributes: ["id", "name"] },
        ],
        order: [["startDate", "ASC"]],
        limit: input.limit,
        offset,
      });

      return {
        events: rows.map((e) => ({
          id: e.id,
          userId: e.userId,
          title: e.title,
          description: e.description,
          venue: e.venue,
          lat: e.lat,
          lng: e.lng,
          startDate: e.startDate.toISOString(),
          endDate: e.endDate?.toISOString() || null,
          category: e.category,
          photoUrl: e.photoUrl,
          createdAt: e.createdAt.toISOString(),
          authorName: e.author?.name || "Organizer",
        })),
        total: count,
      };
    }),

  /**
   * Delete a local event (author only)
   */
  delete: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const event = await LocalEvent.findByPk(input.eventId);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      if (event.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own events." });

      await event.destroy();
      return { success: true };
    }),
});
