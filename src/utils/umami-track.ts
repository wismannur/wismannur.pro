// utils/analytics.ts

import { env } from "@/constants/env";

/**
 * Track an event using Umami Analytics.
 *
 * @param eventName - The name of the event to track.
 * @param eventData - Additional data to include with the event (optional).
 */
export const trackEventToUmami = (
  eventName: string,
  eventData: Record<string, any> = {}
): void => {
  // Only track in production environment
  if (!env.isProduction) return;

  if (typeof window !== "undefined" && (window as any).umami) {
    (window as any).umami.track(eventName, eventData);
  } else {
    console.warn("Umami is not initialized or window is not defined");
  }
};
