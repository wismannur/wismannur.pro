"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { isTrackingAllowed, trackEvent, trackPageView } from "@/lib/umami";

interface UmamiAnalyticsProps {
  websiteId?: string;
  scriptUrl?: string;
}

function UmamiRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);

  // Pageview tracking on public route changes
  useEffect(() => {
    if (!pathname) return;

    const fullUrl = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    if (prevPathRef.current === fullUrl) return;
    prevPathRef.current = fullUrl;

    if (isTrackingAllowed(pathname)) {
      const timer = setTimeout(() => {
        trackPageView(fullUrl, document.title);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Global click listener for data-umami-event attributes on public pages
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isTrackingAllowed(window.location.pathname)) return;

      const target = (e.target as HTMLElement)?.closest?.("[data-umami-event]");
      if (!target) return;

      const eventName = target.getAttribute("data-umami-event");
      if (!eventName) return;

      const dataset = (target as HTMLElement).dataset;
      const eventData: Record<string, string> = {};

      for (const key in dataset) {
        if (key.startsWith("umamiEvent") && key !== "umamiEvent") {
          const dataKey = key.replace(/^umamiEvent/, "");
          const formattedKey = dataKey.charAt(0).toLowerCase() + dataKey.slice(1);
          const val = dataset[key];
          if (val !== undefined) {
            eventData[formattedKey] = val;
          }
        }
      }

      trackEvent(eventName, eventData);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}

export function UmamiAnalytics({
  websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js",
}: UmamiAnalyticsProps) {
  const pathname = usePathname();

  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.umami) {
      const originalTrack = window.umami.track;
      if (typeof originalTrack === "function") {
        window.umami.track = (...args: TAny[]) => {
          if (!isTrackingAllowed(window.location.pathname)) {
            // Strictly block Umami tracking on auth and CMS routes
            return;
          }
          return originalTrack.apply(window.umami, args);
        };
      }

      // Initial page view if on public path
      if (pathname && isTrackingAllowed(pathname)) {
        trackPageView(window.location.pathname, document.title);
      }
    }
  };

  if (!websiteId) return null;

  return (
    <>
      <Script
        src={scriptUrl}
        data-website-id={websiteId}
        data-auto-track="false"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
      <Suspense fallback={null}>
        <UmamiRouteTracker />
      </Suspense>
    </>
  );
}
