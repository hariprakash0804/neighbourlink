import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

/**
 * POST /api/upload
 * Accepts multipart form data with a single file field named "file".
 * Saves to MinIO if configured, otherwise falls back to local filesystem (public/uploads/).
 * Returns the URL path to the uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Generate a unique key
    const rawExt = file.name.split(".").pop() || "jpg";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5);
    const key = `community/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using the shared storage module (MinIO → local filesystem fallback)
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
