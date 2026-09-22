/**
 * Moderation Service — simple profanity and spam detection filter
 */

// Basic list of English and common Hindi profanities
const PROFANITY_BLACKLIST = [
  "abuse", "spam", "scam", "fraud", "cheat", "bastard", "bitch",
  "asshole", "fuck", "shit", "crap", "chutiya", "harami", "kamina",
  "saala", "bhosdike", "madarchod", "behenchod"
];

/**
 * Checks if a string contains blacklisted profanity words or spam patterns
 */
export function containsProfanityOrSpam(text: string): boolean {
  if (!text) return false;

  const lower = text.toLowerCase();

  // 1. Check exact profanity words matching using word boundaries
  for (const word of PROFANITY_BLACKLIST) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      console.warn(`⚠️ Content flagged for profanity match: "${word}"`);
      return true;
    }
  }

  // 2. Check for spam: URL links matching (e.g. promoting external links in reviews/chats)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  if (urlRegex.test(lower)) {
    console.warn("⚠️ Content flagged for suspicious links (Spam filter)");
    return true;
  }

  // 3. Check for spam: character repetition (e.g. "aaaaaaa", "!!!!!")
  const repetitionRegex = /(.)\1{7,}/g; // 8 or more of the same character in a row
  if (repetitionRegex.test(lower)) {
    console.warn("⚠️ Content flagged for character repetition (Spam filter)");
    return true;
  }

  // 4. Check for spam: suspicious repetitive messages (long strings with no vowels or spaces)
  const mashingRegex = /[^aeiou\s\d\W]{10,}/gi; // 10 consonants in a row without space or special char
  if (mashingRegex.test(lower)) {
    console.warn("⚠️ Content flagged for keyboard mashing (Spam filter)");
    return true;
  }

  return false;
}
