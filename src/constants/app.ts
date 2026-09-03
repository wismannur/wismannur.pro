// Runtime constants only — site identity, contact info, social links, and
// SEO defaults now live in the CMS-managed `site_settings` table (see
// src/services/site-settings), so nothing content-shaped belongs here.
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 10, // Pagination default
  STALE_TIME: 1000 * 60 * 5, // 5 minutes
  SITE_NAME: "Wisman Nur",
  DEFAULT_LANGUAGE: "en",
  DEFAULT_THEME: "dark",
} as const;

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  TIMEOUT: 90000, // 90 seconds
  RETRY_ATTEMPTS: 3,
} as const;

export const MY_USER_ID = process.env.NEXT_PUBLIC_FIREBASE_USER_ID;
