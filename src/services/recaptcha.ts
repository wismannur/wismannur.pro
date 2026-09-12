import environment from "@/config/environment";

// Client-side reCAPTCHA v3 token fetch (phase 8.6). The grecaptcha script is
// loaded by the root layout when NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set.
// Stub mode: without the site key this returns "" and the server skips
// verification too (services/core/recaptcha.ts) — until the owner wires keys.
// Legacy's client-side validateCaptchaToken (external validation API) is
// retired: verification now happens inside the submit server actions, where
// it can't be bypassed.

export const getReCaptchaToken = async (): Promise<string> => {
  const { siteKey } = environment.recaptcha;
  if (!siteKey || typeof window === "undefined" || !window.grecaptcha) {
    return "";
  }
  try {
    await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
    return await window.grecaptcha!.execute(siteKey, { action: "submit" });
  } catch (error) {
    console.error("Failed to get reCAPTCHA token:", error);
    // Let the server make the call — it rejects empty tokens when keys are set.
    return "";
  }
};
