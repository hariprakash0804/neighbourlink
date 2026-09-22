import type { FastifyInstance } from "fastify";
import { User as UserModel } from "../lib/models.js";
import { hashPassword, verifyPassword } from "../lib/auth-crypto.js";
import { ensureDbSync } from "../lib/db.js";
import { signJwt, verifyJwt } from "../lib/jwt.js";
import { checkRateLimit } from "../lib/rate-limit.js";

/**
 * Auth REST routes — replaces NextAuth.
 * POST /auth/login    — validate credentials, return JWT
 * POST /auth/register — create user, return JWT
 * GET  /auth/session  — validate JWT, return user info
 */
export async function authRoutes(server: FastifyInstance) {
  /**
   * POST /auth/login
   */
  server.post<{
    Body: { email: string; password: string };
  }>("/login", async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required." });
    }

    // Rate limit: 10 login attempts per 15 minutes per email
    const rateLimitKey = `rate:auth:login:${email.toLowerCase()}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 10, 900);
    if (!rateLimit.allowed) {
      return reply.status(429).send({
        error: "Too many login attempts. Please try again later.",
      });
    }

    await ensureDbSync();

    try {
      const user = await UserModel.findOne({ where: { email } });

      if (!user || !user.passwordHash) {
        return reply.status(401).send({ error: "Invalid email or password." });
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({ error: "Invalid email or password." });
      }

      const token = signJwt({
        userId: user.id,
        email: user.email || "",
        phone: user.phone || null,
        role: user.role,
        name: user.name,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          email: user.email || "",
          phone: user.phone || null,
          name: user.name,
          role: user.role,
        },
      });
    } catch (dbError: any) {
      console.error("Database error during login:", dbError);
      return reply.status(500).send({
        error: "Authentication error. Please try again.",
      });
    }
  });

  /**
   * POST /auth/register
   */
  server.post<{
    Body: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role?: string;
    };
  }>("/register", async (request, reply) => {
    const { email, password, name, phone, role } = request.body || {};

    if (!email || !password || !name || !phone) {
      return reply.status(400).send({
        error: "Email, password, name, and phone are required.",
      });
    }

    // Rate limit: 5 registrations per hour per email/phone
    const emailLimit = await checkRateLimit(
      `rate:auth:register:${email.toLowerCase()}`,
      5,
      3600
    );
    const phoneLimit = await checkRateLimit(
      `rate:auth:register:${phone}`,
      5,
      3600
    );

    if (!emailLimit.allowed || !phoneLimit.allowed) {
      return reply.status(429).send({
        error: "Too many registration attempts. Please try again later.",
      });
    }

    await ensureDbSync();

    try {
      // Check existing email
      const existingUser = await UserModel.findOne({ where: { email } });
      if (existingUser) {
        return reply.status(409).send({
          error: "A user with this email address already exists.",
        });
      }

      // Check existing phone
      const existingPhone = await UserModel.findOne({ where: { phone } });
      if (existingPhone) {
        return reply.status(409).send({
          error: "A user with this phone number already exists.",
        });
      }

      const passwordHash = hashPassword(password);

      const user = await UserModel.create({
        email,
        phone,
        name,
        passwordHash,
        role: role === "VENDOR" ? "VENDOR" : "RESIDENT",
      });

      const token = signJwt({
        userId: user.id,
        email: user.email || "",
        phone: user.phone || null,
        role: user.role,
        name: user.name,
      });

      return reply.status(201).send({
        token,
        user: {
          id: user.id,
          email: user.email || "",
          phone: user.phone || null,
          name: user.name,
          role: user.role,
        },
      });
    } catch (dbError: any) {
      console.error("Database error during registration:", dbError);
      return reply.status(500).send({
        error: "Registration error. Please try again.",
      });
    }
  });

  /**
   * GET /auth/session
   * Returns the current user's session if JWT is valid, or null.
   */
  server.get("/session", async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return reply.send({ user: null });
    }

    const token = authHeader.slice(7);
    const payload = verifyJwt(token);

    if (!payload) {
      return reply.send({ user: null });
    }

    return reply.send({
      user: {
        id: payload.userId,
        email: payload.email,
        phone: payload.phone,
        name: payload.name,
        role: payload.role,
      },
    });
  });
}
