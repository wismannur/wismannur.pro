"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Ensures window scroll position resets to top on client route transitions.
 *
 * Senior Staff Engineering note:
 * - Skips initial mount so SSR-rendered HTML is never interrupted or flashed during hydration.
 * - Uses instant scroll to avoid jank and conflicts with Next.js navigation.
 * - Removes harmful DOM mutations on document.body that cause CSS transform glitches and break
 *   position: fixed elements across the app.
 */
const ScrollToTopAuto = () => {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

export default ScrollToTopAuto;
