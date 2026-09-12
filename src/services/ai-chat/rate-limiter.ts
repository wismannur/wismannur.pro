/**
 * Simple in-memory sliding-window rate limiter for the public AI Chat endpoint.
 * Protects against bot floods and quota exhaustion.
 */

interface RateLimitRecord {
  count: number;
  firstRequestTimestamp: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 25; // 25 messages per 10 mins

// Cleanup stale records periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now - record.firstRequestTimestamp > WINDOW_MS * 2) {
        rateLimitMap.delete(key);
      }
    }
  },
  5 * 60 * 1000
).unref?.();

export function checkChatRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record) {
    rateLimitMap.set(identifier, {
      count: 1,
      firstRequestTimestamp: now,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (now - record.firstRequestTimestamp > WINDOW_MS) {
    // Window expired, reset
    record.count = 1;
    record.firstRequestTimestamp = now;
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetInSeconds = Math.ceil((record.firstRequestTimestamp + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.ceil((record.firstRequestTimestamp + WINDOW_MS - now) / 1000);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetInSeconds,
  };
}
