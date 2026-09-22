const endpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || process.env.MINIO_ENDPOINT || "localhost";
const port = process.env.NEXT_PUBLIC_MINIO_PORT || process.env.MINIO_PORT || "9000";
const bucketName = "neighborlink-docs";

/**
 * Get public facing URL for S3 key or filesystem fallback path.
 * Safe for client-side components (no 'fs' or S3Client dependency).
 * Sanitizes URLs to prevent XSS / javascript: protocol injection.
 */
export function getFileUrl(storageUrl: string | null): string | null {
  if (!storageUrl) return null;

  // Reject dangerous schemes
  const lower = storageUrl.trim().toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    /[\x00-\x1f]/.test(storageUrl)
  ) {
    console.warn("⚠️ Blocked potentially unsafe storage URL scheme:", storageUrl);
    return null;
  }

  if (storageUrl.startsWith("minio://")) {
    const key = storageUrl.replace("minio://", "");
    // Clean key from unexpected characters
    const cleanKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "");
    // Returns MinIO direct URL
    return `http://${endpoint}:${port}/${bucketName}/${cleanKey}`;
  }

  // Ensure local paths start with /uploads/ or /
  if (storageUrl.startsWith("/uploads/") || storageUrl.startsWith("http://") || storageUrl.startsWith("https://")) {
    return storageUrl;
  }

  return storageUrl.startsWith("/") ? storageUrl : `/${storageUrl}`;
}
