import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

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
 * POST /api/upload
 * Requires user authentication.
 * Accepts multipart form data with a single file field named "file".
 * Validates file size (max 5MB), MIME type, and binary magic bytes.
 * Saves to MinIO if configured, otherwise falls back to local filesystem (public/uploads/).
 * Returns the URL path to the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in to upload files." },
        { status: 401 }
      );
    }

    // 2. Enforce Rate Limiting (max 20 uploads per hour per user)
    const rateLimitKey = `rate:upload:${session.user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 20, 3600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 3. Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // 4. Validate declared MIME type against allowlist
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Deep inspection: Validate binary magic bytes
    if (!isValidImageMagicBytes(buffer, file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Corrupted or spoofed file. File content does not match declared image type." },
        { status: 400 }
      );
    }

    // 6. Generate a sanitized unique key
    const rawExt = file.name.split(".").pop() || "jpg";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
    const key = `community/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload using shared storage module (MinIO -> local filesystem fallback)
    const url = await uploadFile(key, buffer, file.type);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
