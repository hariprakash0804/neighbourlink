import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth-crypto";
import { ensureDbSync } from "@/lib/db";
import { User as UserModel } from "@/lib/models";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      phone?: string | null;
      name?: string | null;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    phone?: string | null;
    name?: string | null;
    role: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    phone?: string | null;
    role: string;
  }
}

// ─── Security: Validate AUTH_SECRET at startup ───────────────────────────────
const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ FATAL: AUTH_SECRET must be set and at least 32 characters in production. " +
      "Generate one with: openssl rand -base64 32"
    );
  } else {
    console.warn(
      "⚠️ AUTH_SECRET is missing or too short. Using a fallback for development. " +
      "Set a strong AUTH_SECRET in .env.local for production."
    );
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        // Ensure DB tables exist before querying
        await ensureDbSync();

        try {
          const user = await UserModel.findOne({ where: { email } });

          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password.");
          }

          const isValid = verifyPassword(password, user.passwordHash);
          if (!isValid) {
            throw new Error("Invalid email or password.");
          }

          return {
            id: user.id,
            email: user.email || "",
            phone: user.phone || null,
            name: user.name,
            role: user.role,
          };
        } catch (dbError: any) {
          console.error("Database error during auth:", dbError);
          throw new Error(dbError.message || "Authentication error. Please try again.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.phone = (user as { phone: string | null }).phone || null;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.phone = token.phone;
      session.user.role = token.role;
      return session;
    },
  },
});
