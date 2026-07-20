import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { User } from "@/lib/models";
import { hashPassword } from "@/lib/auth-crypto";
import { createNotification } from "./notifications";

export const authRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
        role: z.enum(["RESIDENT", "VENDOR"]).default("RESIDENT"),
      })
    )
    .mutation(async ({ input }) => {
      // Check if email already exists
      const existingUser = await User.findOne({ where: { email: input.email } });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email address already exists.",
        });
      }

      // Check if phone number already exists
      const existingPhone = await User.findOne({ where: { phone: input.phone } });
      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this phone number already exists.",
        });
      }

      const passwordHash = hashPassword(input.password);

      const user = await User.create({
        email: input.email,
        phone: input.phone,
        name: input.name,
        passwordHash,
        role: input.role,
      });

      // Send welcome notification (triggers email outbox)
      await createNotification({
        userId: user.id,
        type: "WELCOME",
        title: "Welcome to NeighborLink! 🎉",
        body: `Hi ${user.name || "there"}, thank you for signing up on NeighborLink! We're glad to have you in our community.`,
      });

      return {
        success: true,
        userId: user.id,
      };
    }),

  /**
   * Get currently logged-in user profile
   */
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return {
        id: user.id,
        phone: user.phone || "",
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      };
    }),

  /**
   * Update logged-in user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      const updates: any = { name: input.name };
      if (input.email !== undefined) {
        updates.email = input.email === "" ? null : input.email;
      }

      await User.update(updates, { where: { id: userId } });
      return { success: true };
    }),
});
