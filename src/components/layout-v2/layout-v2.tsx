"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_SETTINGS } from "@/services/site-settings/defaults";
import type { SiteSettings } from "@/services/site-settings/types";
import { NavbarV2 } from "./navbar-v2";
import { FooterV2 } from "./footer-v2";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { CommandPalette } from "@/components/common/command-palette";
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget";

interface LayoutV2Props {
  children: React.ReactNode;
  settings?: SiteSettings;
  className?: string;
}

export function LayoutV2({ children, settings = DEFAULT_SITE_SETTINGS, className }: LayoutV2Props) {
  return (
    <div
      className={cn(
        "flex flex-col min-h-screen bg-[#08090C] text-[#E2E8F0] selection:bg-indigo-500/20 selection:text-indigo-300",
        className
      )}
    >
      <NavbarV2 copyrightName={settings.copyrightName} enableBlog={settings.enableBlog} />
      <main className="flex-1 pt-24 sm:pt-28 pb-6">{children}</main>
      <FooterV2 settings={settings} />
      <ScrollToTop />
      {settings.enableAiChat && <FloatingChatWidget />}
      <CommandPalette publicEmail={settings.publicEmail} enableBlog={settings.enableBlog} />
    </div>
  );
}
