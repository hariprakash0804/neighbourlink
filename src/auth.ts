import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyOtp } from "@/lib/otp";
import { ensureDbSync } from "@/lib/db";
import { User as UserModel } from "@/lib/models";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      name?: string | null;
      email?: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    phone: string;
    name?: string | null;
    email?: string | null;
    role: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    phone: string;
    role: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string;
        const otp = credentials?.otp as string;

        if (!phone || !otp) {
          return null;
        }

        // Verify OTP
        const result = await verifyOtp(phone, otp);
        if (!result.success) {
          throw new Error(result.message);
        }

        // Ensure DB tables exist before querying
        await ensureDbSync();

        // Find or create user
        try {
          let user = await UserModel.findOne({ where: { phone } });

          if (!user) {
            user = await UserModel.create({
              phone,
              role: "RESIDENT",
            });
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (dbError) {
          console.error("Database error during auth:", dbError);
          throw new Error("Database error. Please ensure MySQL is running and try again.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone: string }).phone;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.phone = token.phone;
      session.user.role = token.role;
      return session;
    },
  },
});
