import "server-only";

import { ServiceError } from "./base-service";

// Known advance-fee / scam phrases commonly found in unsolicited junk emails
const SCAM_PATTERNS = [
  /unclaimed\s+(?:deposit|funds?|inheritance|property)/i,
  /next\s+of\s+kin/i,
  /branch\s+manager\s+at\s+a\s+bank/i,
  /funds?\s+transfer\s+involving/i,
  /present\s+you\s+as\s+(?:the\s+)?next\s+of\s+kin/i,
  /transfer\s+(?:of\s+)?these\s+funds\s+for\s+our\s+mutual/i,
  /diplomatic\s+(?:courier|delivery|cargo)/i,
  /consignment\s+box/i,
  /central\s+bank\s+of\s+nigeria/i,
  /rediffmail\.com/i,
];

/**
 * Checks if a string looks like pure random alphanumeric gibberish:
 * - Single unbroken string with no spaces that is >= 15 characters (excluding URLs)
 * - Single word token with extreme case-switching entropy (e.g. WwxhmCFPEMneHnNlUOMox)
 * - Single word token >= 35 characters (excluding URLs/emails)
 */
export function isGibberish(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // If text starts with http:// or https://, allow URLs
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return false;
  }

  // 1. If text has >= 15 chars and zero spaces or punctuation separating words
  if (trimmed.length >= 15 && !/\s/.test(trimmed) && !/[.,/#!$%^&*;:{}=\-_`~()?]/.test(trimmed)) {
    return true;
  }

  // 2. Analyze individual words
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    if (/^https?:\/\//i.test(word) || word.includes("@")) {
      continue;
    }

    // Unreasonably long single token
    if (word.length > 35) {
      return true;
    }

    // High case-switching entropy in a token (e.g., "WwxhmCFPEMneHnNlUOMox" or "cRbgKiwjHXFUAVFGezJqiZfN")
    // Natural CamelCase words (e.g. "JavaScript", "McDonald", "TypeScript") have 1-2 switches.
    if (word.length >= 12) {
      let caseSwitches = 0;
      for (let i = 1; i < word.length; i++) {
        const prev = word[i - 1];
        const curr = word[i];
        const prevUpper = prev >= "A" && prev <= "Z";
        const currUpper = curr >= "A" && curr <= "Z";
        const prevLower = prev >= "a" && prev <= "z";
        const currLower = curr >= "a" && curr <= "z";

        if ((prevUpper && currLower) || (prevLower && currUpper)) {
          caseSwitches++;
        }
      }
      // If a single word has 4 or more case transitions, it's virtually always generated random gibberish
      if (caseSwitches >= 4) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detects known advance-fee scam, phishing, or lottery spam phrases.
 */
export function isScamContent(text: string): boolean {
  if (!text) return false;
  return SCAM_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Validates honeypot field. If filled, the request comes from an automated bot.
 */
export function assertHoneypotClean(honeypot?: string | null): void {
  if (honeypot && honeypot.trim().length > 0) {
    throw new ServiceError("Spam submission detected.", "spam-detected");
  }
}

/**
 * Validates message, name, and subject fields against automated gibberish and scams.
 */
export function assertLegitimateInquiry({
  name,
  subject,
  message,
}: {
  name?: string;
  subject?: string;
  message?: string;
}): void {
  if (name && isGibberish(name)) {
    throw new ServiceError(
      "Invalid name format. Please provide a legitimate name.",
      "invalid-input"
    );
  }

  if (subject) {
    if (isGibberish(subject)) {
      throw new ServiceError(
        "Invalid subject format. Please provide a clear subject.",
        "invalid-input"
      );
    }
    if (isScamContent(subject)) {
      throw new ServiceError("Submission rejected.", "spam-detected");
    }
  }

  if (message) {
    if (isGibberish(message)) {
      throw new ServiceError(
        "Invalid message content. Please describe your inquiry with complete words.",
        "invalid-input"
      );
    }
    if (isScamContent(message)) {
      throw new ServiceError("Submission rejected.", "spam-detected");
    }
  }
}
