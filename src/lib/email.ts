/**
 * Email Service — helper to send notification emails & digests
 * Mocked in development to log cleanly to console.
 */

export async function sendNotificationEmail(
  email: string,
  title: string,
  body: string
): Promise<boolean> {
  // DEV MODE / FALLBACK: Just log to console
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║       ✉️ EMAIL OUTBOX (Mock)          ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  To: ${email.padEnd(31)}║`);
  console.log(`║  Subject: ${title.padEnd(26)}║`);
  console.log(`║  Body: ${body.slice(0, 30).padEnd(30)}...║`);
  console.log("╚══════════════════════════════════════╝\n");
  
  return true;
}

export async function sendDigestEmail(
  email: string,
  notifications: { title: string; body: string }[]
): Promise<boolean> {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║       ✉️ EMAIL DIGEST OUTBOX (Mock)   ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  To: ${email.padEnd(31)}║`);
  console.log(`║  Subject: Missed Updates Roundup      ║`);
  console.log(`║  Total Updates: ${String(notifications.length).padEnd(21)}║`);
  console.log("╠══════════════════════════════════════╣");
  notifications.slice(0, 3).forEach((n, idx) => {
    console.log(`║  ${idx + 1}. ${n.title.slice(0, 30).padEnd(32)}║`);
  });
  if (notifications.length > 3) {
    console.log(`║  ... and ${String(notifications.length - 3).padEnd(2)} more update(s)             ║`);
  }
  console.log("╚══════════════════════════════════════╝\n");

  return true;
}
