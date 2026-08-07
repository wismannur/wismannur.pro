// Single source for the canonical base URL (layout metadataBase, sitemap,
// robots). Env-level rather than DB because robots/sitemap resolve it at
// build time and it never changes without a redeploy anyway.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.wismannur.pro";
