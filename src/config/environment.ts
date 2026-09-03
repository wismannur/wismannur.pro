// Minimal environment shim for the frontend-only phase.
// Firebase / reCAPTCHA / Umami are deferred; values are placeholders so any
// module referencing `environment.*` keeps compiling. `app.envProd/envDev`
// track NODE_ENV so production-gated behavior (e.g. reCAPTCHA) still branches.
export const environment = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
    databaseURL: "",
    userId: process.env.NEXT_PUBLIC_FIREBASE_USER_ID,
  },
  recaptcha: {
    // Server-side verification lives in services/core/recaptcha.ts
    // (RECAPTCHA_SECRET_KEY); the legacy external validation API is retired.
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "",
  },
  analytics: {
    umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "",
    umamiScriptUrl: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "",
  },
  app: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    envProd: process.env.NODE_ENV === "production",
    envDev: process.env.NODE_ENV !== "production",
    debug: false,
  },
} as const;

export default environment;
