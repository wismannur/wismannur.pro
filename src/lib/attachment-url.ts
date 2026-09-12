import { SITE_URL } from "./site-url";

/**
 * Returns the Vercel Blob storage hostname dynamically extracted from
 * BLOB_STORE_DOMAIN or BLOB_READ_WRITE_TOKEN, falling back to project default store.
 */
export function getBlobStoreHost(): string {
  if (process.env.BLOB_STORE_DOMAIN) {
    return process.env.BLOB_STORE_DOMAIN;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const parts = token.split("_");
    if (parts.length >= 4 && parts[3]) {
      return `${parts[3].toLowerCase()}.public.blob.vercel-storage.com`;
    }
  }
  return "dclry5yziridkrl7.public.blob.vercel-storage.com";
}

/**
 * Converts a raw Vercel Blob URL (e.g. https://*.public.blob.vercel-storage.com/outreach-attachments/file.pdf)
 * to our branded domain URL (e.g. https://www.wismannur.pro/attachments/outreach-attachments/file.pdf).
 */
export function toCustomAttachmentUrl(url?: string | null): string {
  if (!url) return "";
  if (url.includes(".public.blob.vercel-storage.com/")) {
    const pathname = url.split(".public.blob.vercel-storage.com/")[1];
    return `${SITE_URL}/attachments/${pathname}`;
  }
  return url;
}

/**
 * Converts a custom domain attachment URL back to the direct reachable Vercel Blob URL.
 * Useful for backend services (like Resend API) that need to fetch the file directly.
 */
export function toDirectBlobUrl(url?: string | null): string {
  if (!url) return "";
  if (url.includes("/attachments/")) {
    const pathname = url.split("/attachments/")[1];
    const host = getBlobStoreHost();
    return `https://${host}/${pathname}`;
  }
  return url;
}
