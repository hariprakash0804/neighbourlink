import type { FastifyInstance } from "fastify";
import { uploadFile } from "../lib/storage.js";
import { verifyJwt } from "../trpc.js";
import { checkRateLimit } from "../lib/rate-limit.js";

/**
 * Validate binary magic bytes to ensure file matches declared image MIME types.
 */
function isValidImageMagicBytes(buffer: Buffer, declaredType: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (
    (declaredType === "image/jpeg" || declaredType === "image/jpg") &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    declaredType === "image/png" &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    declaredType === "image/webp" &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }

  // GIF: GIF87a or GIF89a
  if (
    declaredType === "image/gif" &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return true;
  }

  return false;
}

/**
 * POST /upload
 * Requires JWT authentication.
 * Accepts multipart form data with a single file field named "file".
 * Validates file size (max 5MB), MIME type, and binary magic bytes.
 * Returns the URL path to the uploaded file.
 */
export async function uploadRoutes(server: FastifyInstance) {
  server.post("/", async (request, reply) => {
    try {
      // 1. Enforce Authentication
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({
          error: "Unauthorized. You must be logged in to upload files.",
        });
      }

      const payload = verifyJwt(authHeader.slice(7));
      if (!payload) {
        return reply.status(401).send({
          error: "Unauthorized. Invalid or expired token.",
        });
      }

      // 2. Enforce Rate Limiting (max 20 uploads per hour per user)
      const rateLimitKey = `rate:upload:${payload.userId}`;
      const rateLimit = await checkRateLimit(rateLimitKey, 20, 3600);
      if (!rateLimit.allowed) {
        return reply.status(429).send({
          error: "Upload rate limit exceeded. Please try again later.",
        });
      }

      const file = await request.file();

      if (!file) {
        return reply.status(400).send({ error: "No file uploaded" });
      }

      // 3. Validate declared MIME type against allowlist
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
        return reply.status(400).send({
          error:
            "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
        });
      }

      // Convert stream to Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of file.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // 4. Validate file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({
          error: "File too large. Maximum size is 5MB.",
        });
      }

      // 5. Deep inspection: Validate binary magic bytes
      if (!isValidImageMagicBytes(buffer, file.mimetype.toLowerCase())) {
        return reply.status(400).send({
          error:
            "Corrupted or spoofed file. File content does not match declared image type.",
        });
      }

      // 6. Generate a sanitized unique key
      const rawExt = file.filename.split(".").pop() || "jpg";
      const ext =
        rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
      const key = `community/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Upload using shared storage module (MinIO -> local filesystem fallback)
      const url = await uploadFile(key, buffer, file.mimetype);

      return reply.send({ success: true, url });
    } catch (error) {
      console.error("❌ Upload failed:", error);
      return reply.status(500).send({
        error: "Upload failed. Please try again.",
      });
    }
  });
}
