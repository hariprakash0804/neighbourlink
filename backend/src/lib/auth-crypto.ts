import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash password using Node's native scryptSync.
 * Scrypt is a memory-hard key derivation function.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against candidate.
 * Employs timingSafeEqual to protect against timing analysis.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    
    const candidateHash = scryptSync(password, salt, 64);
    const originalHash = Buffer.from(hash, "hex");
    
    return timingSafeEqual(candidateHash, originalHash);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}
