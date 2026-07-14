/**
 * OTP Service — Pluggable interface for SMS OTP providers
 * 
 * DEV MODE: OTPs are logged to console and stored in memory (Map).
 * The default dev OTP is always "123456" for any phone number.
 * 
 * PRODUCTION: Replace the sendSms() implementation with your chosen provider
 * (Twilio, MSG91, Gupshup, etc.)
 */

// In-memory OTP store for development
// In production, use Redis with TTL
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between sends

// Rate limiting: track last send time per phone
const rateLimitStore = new Map<string, number>();

/**
 * Generate a random numeric OTP
 */
function generateOtp(): string {
  // In dev mode, always return a fixed OTP for easy testing
  if (process.env.NODE_ENV === "development") {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
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

/**
 * Send OTP to a phone number
 */
export async function sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
  // Rate limiting
  const lastSent = rateLimitStore.get(phone);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    const waitSeconds = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000);
    return {
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
    };
  }

  const otp = generateOtp();

  // Store OTP with expiry
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  // Update rate limit
  rateLimitStore.set(phone, Date.now());

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
  const stored = otpStore.get(phone);

  if (!stored) {
    return { success: false, message: "No OTP found. Please request a new one." };
  }

  // Check expiry
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return { success: false, message: "OTP expired. Please request a new one." };
  }

  // Check max attempts
  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return { success: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }

  // Verify
  if (stored.otp !== otp) {
    stored.attempts++;
    return {
      success: false,
      message: `Incorrect OTP. ${MAX_ATTEMPTS - stored.attempts} attempts remaining.`,
    };
  }

  // Success — clean up
  otpStore.delete(phone);
  rateLimitStore.delete(phone);

  return { success: true, message: "OTP verified successfully" };
}
