import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import { sendOtp as sendOtpService } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rate-limit";
import { TRPCError } from "@trpc/server";
import { User } from "@/lib/models";

export const authRouter = router({
  /**
   * Send OTP to phone number
   * This doesn't go through NextAuth — it's a pre-auth step
   */
  sendOtp: publicProcedure
    .input(
      z.object({
        phone: z
          .string()
          .min(10, "Phone number must be at least 10 digits")
          .max(15, "Phone number is too long")
          .regex(/^\+?[0-9]+$/, "Invalid phone number format"),
      })
    )
    .mutation(async ({ input }) => {
      // Normalize phone: ensure it starts with country code
      let phone = input.phone.replace(/\D/g, "");
      if (phone.length === 10) {
        phone = `+91${phone}`;
      } else if (!phone.startsWith("+")) {
        phone = `+${phone}`;
      }

      // Apply rate limit: 3 requests per phone per minute (60 seconds)
      const rateLimitKey = `rate:otp:${phone}`;
      const limitResult = await checkRateLimit(rateLimitKey, 3, 60);
      if (!limitResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many OTP requests. Please wait one minute before requesting again.",
        });
      }

      const result = await sendOtpService(phone);
      return result;
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
        phone: user.phone,
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
