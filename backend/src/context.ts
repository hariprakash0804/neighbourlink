import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import sequelize, { ensureDbSync } from "./lib/db.js";
import { verifyJwt, type JwtPayload } from "./lib/jwt.js";

export interface Context {
  db: typeof sequelize;
  session: JwtPayload | null;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Context — available in every tRPC procedure.
 * Extracts JWT from Authorization header instead of NextAuth session.
 */
export async function createContext({ req }: CreateFastifyContextOptions): Promise<Context> {
  // Ensure DB tables exist (no-op after first call)
  await ensureDbSync();

  let session: JwtPayload | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    session = verifyJwt(token);
  }

  return {
    db: sequelize,
    session,
    headers: req.headers,
  };
}
