import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import { Vendor, User, AuditLog, EssentialService } from "@/lib/models";
import { indexVendors } from "@/lib/meilisearch";
import { TRPCError } from "@trpc/server";
import { createNotification } from "./notifications";

export const adminRouter = router({
  /**
   * List all vendors awaiting ID verification (tier UNVERIFIED but uploaded docs)
   * Implementation: Phase 4
   */
  getPendingVendors: adminProcedure.query(async () => {
    const pendingVendors = await Vendor.findAll({
      where: {
        verificationTier: "UNVERIFIED",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["phone", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return {
      vendors: pendingVendors.map((v) => ({
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
        idDocumentUrl: v.idDocumentUrl,
        ratingAvg: v.ratingAvg,
        ratingCount: v.ratingCount,
        responseTimeMin: v.responseTimeMin,
        createdAt: v.createdAt.toISOString(),
        user: v.user
          ? {
              name: v.user.name,
              phone: v.user.phone,
              email: v.user.email,
            }
          : null,
      })),
    };
  }),

  /**
   * Approve a vendor (changes verification tier to ID_VERIFIED)
   * Implementation: Phase 4
   */
  verifyVendor: adminProcedure
    .input(z.object({ vendorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor profile not found" });
      }

      // Update verification tier to ID_VERIFIED
      await Vendor.update(
        { verificationTier: "ID_VERIFIED" },
        { where: { id: input.vendorId } }
      );

      await AuditLog.create({
        actorId,
        action: "APPROVE_VENDOR",
        targetId: input.vendorId,
        metadata: { businessName: vendor.businessName } as any,
      });

      // Notify vendor about approval (triggers email outbox)
      await createNotification({
        userId: vendor.userId,
        type: "VERIFICATION_UPDATE",
        title: "Verification Approved! 🎉",
        body: `Great news! Your business profile for "${vendor.businessName}" has been approved by our admin team. You are now recognized as an ID_VERIFIED vendor!`,
      });

      // Sync verified vendor to Meilisearch index
      try {
        const updatedVendor = await Vendor.findByPk(input.vendorId);
        if (updatedVendor) {
          await indexVendors([
            {
              id: updatedVendor.id,
              businessName: updatedVendor.businessName,
              description: updatedVendor.description,
              category: updatedVendor.category,
              verificationTier: updatedVendor.verificationTier,
              ratingAvg: updatedVendor.ratingAvg,
              ratingCount: updatedVendor.ratingCount,
              _geo: {
                lat: updatedVendor.lat,
                lng: updatedVendor.lng,
              },
            },
          ]);
        }
      } catch (meiliError) {
        console.error("⚠️ Failed to sync verified vendor to Meilisearch:", meiliError);
      }

      return { success: true };
    }),

  /**
   * Reject a vendor with a reason
   * Implementation: Phase 4
   */
  rejectVendor: adminProcedure
    .input(
      z.object({
        vendorId: z.string(),
        reason: z.string().min(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;
      const vendor = await Vendor.findByPk(input.vendorId);
      if (!vendor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vendor profile not found" });
      }

      // Reset document URL so vendor can re-upload correct documents
      await Vendor.update(
        { idDocumentUrl: null, verificationTier: "UNVERIFIED" },
        { where: { id: input.vendorId } }
      );

      await AuditLog.create({
        actorId,
        action: "REJECT_VENDOR",
        targetId: input.vendorId,
        metadata: { businessName: vendor.businessName, reason: input.reason } as any,
      });

      // Notify vendor about rejection (triggers email outbox)
      await createNotification({
        userId: vendor.userId,
        type: "VERIFICATION_UPDATE",
        title: "Verification Request Rejected ⚠️",
        body: `Your verification request for "${vendor.businessName}" was rejected by our admin team. Reason: "${input.reason}". Please review your documents and re-upload.`,
      });

      return { success: true };
    }),

  /**
   * List audit log entries
   * Implementation: Phase 4
   */
  auditLogList: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const { rows, count } = await AuditLog.findAndCountAll({
        limit: input.limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      return {
        entries: rows.map((r) => ({
          id: r.id,
          actorId: r.actorId,
          action: r.action,
          targetId: r.targetId,
          metadata: r.metadata as any,
          createdAt: r.createdAt.toISOString(),
        })),
        total: count,
      };
    }),

  /**
   * Create a new Essential Service
   */
  createEssentialService: adminProcedure
    .input(
      z.object({
        category: z.enum(["HOSPITAL", "PHARMACY", "POLICE", "FIRE", "ENTERTAINMENT", "SCHOOL", "ATM", "BANK"]),
        name: z.string().min(2),
        lat: z.number(),
        lng: z.number(),
        phone: z.string().min(5),
        is24x7: z.boolean().default(false),
        isGovtSource: z.boolean().default(false),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;
      const service = await EssentialService.create({
        category: input.category,
        name: input.name,
        lat: input.lat,
        lng: input.lng,
        phone: input.phone,
        is24x7: input.is24x7,
        isGovtSource: input.isGovtSource,
        metadata: input.metadata || {},
      });

      await AuditLog.create({
        actorId,
        action: "CREATE_ESSENTIAL_SERVICE",
        targetId: service.id,
        metadata: { name: service.name, category: service.category } as any,
      });

      return { success: true, service };
    }),

  /**
   * Delete an Essential Service
   */
  deleteEssentialService: adminProcedure
    .input(z.object({ serviceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;
      const service = await EssentialService.findByPk(input.serviceId);
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Essential Service not found" });
      }

      await service.destroy();

      await AuditLog.create({
        actorId,
        action: "DELETE_ESSENTIAL_SERVICE",
        targetId: input.serviceId,
        metadata: { name: service.name, category: service.category } as any,
      });

      return { success: true };
    }),

  /**
   * List all Essential Services (Admin overview)
   */
  listAllEssentialServices: adminProcedure.query(async () => {
    const services = await EssentialService.findAll({
      order: [
        ["category", "ASC"],
        ["name", "ASC"],
      ],
    });

    return {
      services: services.map((s) => ({
        id: s.id,
        category: s.category,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        phone: s.phone,
        is24x7: s.is24x7,
        isGovtSource: s.isGovtSource,
        metadata: s.metadata as any,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }),

  /**
   * Bulk Create Essential Services (Import from Excel/CSV)
   */
  bulkCreateEssentialServices: adminProcedure
    .input(
      z.object({
        services: z.array(
          z.object({
            category: z.enum(["HOSPITAL", "PHARMACY", "POLICE", "FIRE", "ENTERTAINMENT", "SCHOOL", "ATM", "BANK"]),
            name: z.string().min(2),
            lat: z.number(),
            lng: z.number(),
            phone: z.string().min(5),
            is24x7: z.boolean().default(false),
            isGovtSource: z.boolean().default(false),
            metadata: z.record(z.string(), z.any()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const actorId = ctx.session.userId;

      const createdServices = await EssentialService.bulkCreate(
        input.services.map((s) => ({
          category: s.category,
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          phone: s.phone,
          is24x7: s.is24x7,
          isGovtSource: s.isGovtSource,
          metadata: s.metadata || {},
        }))
      );

      await AuditLog.create({
        actorId,
        action: "BULK_CREATE_ESSENTIAL_SERVICES",
        targetId: null,
        metadata: { count: createdServices.length } as any,
      });

      return { success: true, count: createdServices.length };
    }),
});
