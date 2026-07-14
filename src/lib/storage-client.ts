const endpoint = process.env.MINIO_ENDPOINT || "localhost";
const port = process.env.MINIO_PORT || "9000";
const bucketName = "neighborlink-docs";

/**
 * Get public facing URL for S3 key or filesystem fallback path.
 * Safe for client-side components (no 'fs' or S3Client dependency).
 */
export function getFileUrl(storageUrl: string | null): string | null {
  if (!storageUrl) return null;

  if (storageUrl.startsWith("minio://")) {
    const key = storageUrl.replace("minio://", "");
    // Returns MinIO direct URL
    return `http://${endpoint}:${port}/${bucketName}/${key}`;
  }

  // Return local static path directly
  return storageUrl;
}
