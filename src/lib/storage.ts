import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const endpoint = process.env.MINIO_ENDPOINT || "localhost";
const port = process.env.MINIO_PORT || "9000";
const accessKeyId = process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.MINIO_SECRET_KEY || "minioadmin";
const bucketName = "neighborlink-docs";

let s3Client: S3Client | null = null;

// Lazily get S3 client
function getS3Client(): S3Client | null {
  if (!process.env.MINIO_ENDPOINT) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: `http://${endpoint}:${port}`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: "us-east-1", // MinIO doesn't care, but AWS SDK requires it
      forcePathStyle: true, // required for MinIO
    });
  }
  return s3Client;
}

/**
 * Upload a document buffer to MinIO, or fallback to local disk uploads.
 * returns the saved file key/url path.
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const s3 = getS3Client();

  if (s3) {
    try {
      console.log(`📦 Attempting MinIO upload for key: ${key}...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
      console.log(`✅ MinIO upload successful: ${key}`);
      return `minio://${key}`;
    } catch (s3Error) {
      console.warn("⚠️ MinIO upload failed, falling back to local filesystem:", s3Error);
    }
  }

  // ─── LOCAL FILESYSTEM FALLBACK ───
  try {
    const uploadDir = path.resolve(process.cwd(), "public", "uploads");

    // Sanitize the key: strip path traversal patterns and control characters
    const sanitizedKey = key
      .replace(/\.\./g, "")             // strip directory traversal
      .replace(/[\/\\]/g, "-")          // replace path separators with dashes
      .replace(/[\x00-\x1f]/g, "")     // strip control characters
      .replace(/[^a-zA-Z0-9._\-]/g, "_"); // replace remaining unsafe chars

    const filePath = path.resolve(uploadDir, sanitizedKey);

    // SECURITY: Verify the resolved path is still within the uploads directory
    if (!filePath.startsWith(uploadDir)) {
      console.error(`❌ Path traversal attempt blocked: key="${key}" resolved to "${filePath}"`);
      throw new Error("Invalid file path");
    }

    const parentDir = path.dirname(filePath);
    
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Local filesystem upload successful: /uploads/${sanitizedKey}`);
    return `/uploads/${sanitizedKey}`;
  } catch (fsError) {
    console.error("❌ Both MinIO and local filesystem storage failed:", fsError);
    throw new Error("Failed to save uploaded file");
  }
}

export { getFileUrl } from "./storage-client";
