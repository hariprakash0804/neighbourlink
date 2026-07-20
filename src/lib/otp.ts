/**
 * OTP Service — Hardened with Redis storage + timing-safe comparison
 *
 * DEV MODE: OTPs are logged to console. Use FORCE_DEV_OTP=true in .env.local
 * to enable the fixed "123456" OTP for testing. This is SEPARATE from NODE_ENV
 * to prevent accidental leakage in production.
 *
 * PRODUCTION: Replace the sendSms() implementation with your chosen provider
 * (Twilio, MSG91, Gupshup, etc.)
 */

import crypto from "crypto";
import { getRedisClient, isRedisReady } from "./redis";
import { checkRateLimit } from "./rate-limit";

const OTP_TTL_SECS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_SECS = 60; // 1 minute between sends
const RATE_LIMIT_MAX_SENDS = 3;   // Max 3 sends per minute per phone

// In-memory fallback OTP store (used ONLY when Redis is unavailable)
const otpFallbackStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

/**
 * Generate a random 6-digit numeric OTP.
 * Uses crypto.randomInt for cryptographic randomness.
 */
function generateOtp(): string {
  // Explicit opt-in flag for dev OTP — NEVER tied to NODE_ENV
  if (process.env.FORCE_DEV_OTP === "true") {
    return "123456";
  }
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Timing-safe OTP comparison to prevent timing attacks.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Get a Redis key for OTP storage.
 */
function otpKey(phone: string): string {
  return `otp:${phone}`;
}

/**
 * Send SMS via provider (dev: console log, prod: actual SMS API)
 */
async function sendSms(phone: string, message: string): Promise<boolean> {
  // DEV MODE: Just log to console
  if (!process.env.SMS_PROVIDER_API_KEY) {
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║       📱 OTP SMS (Dev Mode)          ║");
    console.log("╠══════════════════════════════════════╣");
    console.log(`║  Phone: ${phone.padEnd(28)}║`);
    console.log(`║  Message: ${message.padEnd(26)}║`);
    console.log("╚══════════════════════════════════════╝\n");
    return true;
  }

  // PRODUCTION: Integrate your SMS provider here
  // Example for Twilio:
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({ to: phone, from: twilioNumber, body: message });

  // Example for MSG91:
  // await fetch(`https://api.msg91.com/api/v5/otp`, { ... });

  console.warn("SMS_PROVIDER_API_KEY is set but no provider is configured. Implement sendSms() for production.");
  return false;
}

// ─── Redis-backed OTP Store ───────────────────────────────────────────────────

async function storeOtpRedis(phone: string, otp: string): Promise<boolean> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return false;

  try {
    const key = otpKey(phone);
    const data = JSON.stringify({ otp, attempts: 0 });
    await redis.setex(key, OTP_TTL_SECS, data);
    return true;
  } catch (err) {
    console.error("❌ Redis OTP store error:", err);
    return false;
  }
}

async function getOtpRedis(phone: string): Promise<{ otp: string; attempts: number } | null> {
  const redis = getRedisClient();
  const ready = await isRedisReady();
  if (!redis || !ready) return null;

  try {
    const key = otpKey(phone);
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Redis OTP get error:", err);
    return null;
  }
}

async function incrementAttemptsRedis(phone: string, currentData: { otp: string; attempts: number }): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const key = otpKey(phone);
    const ttl = await redis.ttl(key);
    const updatedData = JSON.stringify({ otp: currentData.otp, attempts: currentData.attempts + 1 });
    if (ttl > 0) {
      await redis.setex(key, ttl, updatedData);
    }
  } catch (err) {
    console.error("❌ Redis OTP increment error:", err);
  }
}

async function deleteOtpRedis(phone: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(otpKey(phone));
  } catch (err) {
    console.error("❌ Redis OTP delete error:", err);
  }
}

// ─── In-Memory Fallback OTP Store ─────────────────────────────────────────────

function storeOtpMemory(phone: string, otp: string): void {
  otpFallbackStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_SECS * 1000,
    attempts: 0,
  });
}

function getOtpMemory(phone: string): { otp: string; expiresAt: number; attempts: number } | null {
  const stored = otpFallbackStore.get(phone);
  if (!stored) return null;
  if (Date.now() > stored.expiresAt) {
    otpFallbackStore.delete(phone);
    return null;
  }
  return stored;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send OTP to a phone number
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  // Rate limiting via Redis (or fail-open if Redis is down)
  const rateLimitKey = `rate:otp:send:${phone}`;
  const limitResult = await checkRateLimit(rateLimitKey, RATE_LIMIT_MAX_SENDS, RATE_LIMIT_WINDOW_SECS);
  if (!limitResult.allowed) {
    return {
      success: false,
      message: `Too many OTP requests. Please wait before requesting a new OTP.`,
    };
  }

  const otp = generateOtp();

  // Try Redis first, fall back to in-memory
  const storedInRedis = await storeOtpRedis(phone, otp);
  if (!storedInRedis) {
    console.warn("⚠️ Redis unavailable for OTP storage, using in-memory fallback");
    storeOtpMemory(phone, otp);
  }

  // Send SMS
  const sent = await sendSms(phone, `Your NeighborLink verification code is: ${otp}. Valid for 5 minutes.`);

  if (!sent && process.env.SMS_PROVIDER_API_KEY) {
    return { success: false, message: "Failed to send OTP. Please try again." };
  }

  return {
    success: true,
    message: process.env.SMS_PROVIDER_API_KEY
      ? "OTP sent successfully"
      : `OTP sent (dev mode). Check server console. Use code: ${otp}`,
  };
}

/**
 * Verify an OTP for a phone number
 */
export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  // Try Redis first
  const redisData = await getOtpRedis(phone);

  if (redisData) {
    // Redis path
    if (redisData.attempts >= MAX_ATTEMPTS) {
      await deleteOtpRedis(phone);
      return { success: false, message: "Too many incorrect attempts. Please request a new OTP." };
    }

    if (!safeCompare(redisData.otp, otp)) {
      await incrementAttemptsRedis(phone, redisData);
      const remaining = MAX_ATTEMPTS - redisData.attempts - 1;
      return {
        success: false,
        message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      };
    }

    // Success — clean up
    await deleteOtpRedis(phone);
    return { success: true, message: "OTP verified successfully" };
  }

  // In-memory fallback path
  const memData = getOtpMemory(phone);
  if (!memData) {
    return { success: false, message: "No OTP found. Please request a new one." };
  }

  if (memData.attempts >= MAX_ATTEMPTS) {
    otpFallbackStore.delete(phone);
    return { success: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }

  if (!safeCompare(memData.otp, otp)) {
    memData.attempts++;
    const remaining = MAX_ATTEMPTS - memData.attempts;
    return {
      success: false,
      message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // Success — clean up
  otpFallbackStore.delete(phone);
  return { success: true, message: "OTP verified successfully" };
}
