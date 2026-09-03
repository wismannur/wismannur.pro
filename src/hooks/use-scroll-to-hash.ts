"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";

export const useScrollToHash = () => {
  // Re-run when the route changes; the hash itself is read from window.location.
  const pathname = usePathname();

  const scrollToHash = useCallback(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  useEffect(() => {
    scrollToHash();
  }, [scrollToHash, pathname]);

  return { scrollToHash };
};
