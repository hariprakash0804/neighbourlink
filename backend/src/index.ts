import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./routers/_app.js";
import { createContext } from "./trpc.js";
import { authRoutes } from "./routes/auth.js";
import { uploadRoutes } from "./routes/upload.js";
import { healthRoutes } from "./routes/health.js";
import { ensureDbSync } from "./lib/db.js";

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
    maxParamLength: 5000,
  });

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  await server.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // ─── Multipart (for file uploads) ──────────────────────────────────────────
  await server.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // ─── Security Headers ─────────────────────────────────────────────────────
  server.addHook("onSend", async (_request, reply) => {
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("X-XSS-Protection", "1; mode=block");
    reply.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(self)"
    );
    if (process.env.NODE_ENV === "production") {
      reply.header(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }
  });

  // ─── Database sync ─────────────────────────────────────────────────────────
  await ensureDbSync();

  // ─── REST Routes ───────────────────────────────────────────────────────────
  await server.register(authRoutes, { prefix: "/auth" });
  await server.register(uploadRoutes, { prefix: "/upload" });
  await server.register(healthRoutes, { prefix: "/health" });

  // ─── tRPC ──────────────────────────────────────────────────────────────────
  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  return server;
}

async function main() {
  try {
    const server = await buildServer();

    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 Backend server running at http://${HOST}:${PORT}`);
    console.log(`   tRPC endpoint: http://${HOST}:${PORT}/trpc`);
    console.log(`   Health check:  http://${HOST}:${PORT}/health`);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

main();
