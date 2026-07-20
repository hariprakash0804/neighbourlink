import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { SosAlert } from "@/lib/models";
import { TRPCError } from "@trpc/server";

export const sosRouter = router({
  /**
   * Trigger an SOS alert — logs the user's live location and emergency contacts.
   * In production, this would send SMS via Twilio/SNS to saved contacts.
   */
  trigger: protectedProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        message: z.string().max(500).optional(),
        emergencyContacts: z.array(z.string()).optional(), // phone numbers
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.userId;

      // Default emergency contacts if none provided
      const contacts = input.emergencyContacts?.length
        ? input.emergencyContacts
        : ["112", "100"]; // National Helpline + Police

      const alert = await SosAlert.create({
        userId,
        lat: input.lat,
        lng: input.lng,
        message: input.message || `EMERGENCY ALERT from NeighborLink user`,
        contactsNotified: contacts as any,
      });

      // Build Google Maps live location link
      const locationLink = `https://maps.google.com/?q=${input.lat},${input.lng}`;

      console.log(`🆘 SOS Alert triggered by user ${userId}!`);
      console.log(`   Location: ${locationLink}`);
      console.log(`   Contacts to notify: ${contacts.join(", ")}`);
      console.log(`   Message: ${input.message || "Emergency alert"}`);

      // In production: send SMS to each contact via Twilio
      // await Promise.all(contacts.map(phone => sendSms(phone, `...`)));

      return {
        success: true,
        alertId: alert.id,
        locationLink,
        contactsNotified: contacts,
      };
    }),
});
