import "server-only";

import { ServiceError } from "./base-service";

// Server-side reCAPTCHA v3 verification (phase 8.6). Runs inside the public
// submit actions so it can't be bypassed by calling the RPC directly.
// Stub mode: while RECAPTCHA_SECRET_KEY is unset (keys pending from the
// owner), verification is skipped — rate limiting still applies.

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5;

export async function assertHuman(token: string | undefined): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return;

  if (!token) {
    throw new ServiceError("reCAPTCHA verification failed", "recaptcha-failed");
  }

  let result: { success?: boolean; score?: number };
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!response.ok) throw new Error(`siteverify HTTP ${response.status}`);
    result = await response.json();
  } catch (error) {
    throw new ServiceError("reCAPTCHA verification failed", "recaptcha-failed", error);
  }

  // v3 returns a score; treat a missing score (v2 keys) as pass/fail only.
  if (!result.success || (result.score !== undefined && result.score < MIN_SCORE)) {
    throw new ServiceError("reCAPTCHA verification failed", "recaptcha-failed");
  }
}
