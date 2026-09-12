"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type React from "react";
import { useState } from "react";

import ScrollToTopAuto from "@/components/layout/scroll-to-top-auto";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { LoadingProvider, useLoading } from "@/contexts/loading-context";
import { ThemeProvider } from "@/hooks/use-theme";
import { makeQueryClient } from "@/lib/query-client";

// Mirrors the legacy App.tsx LoadingWrapper: surfaces the global loading overlay.
const LoadingWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, text } = useLoading();

  return (
    <>
      <LoadingOverlay isLoading={isLoading} text={text} fullScreen={true} />
      {children}
    </>
  );
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Create the client once per browser session (App Router pattern).
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LoadingProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <LoadingWrapper>{children}</LoadingWrapper>
              <ScrollToTopAuto />
            </TooltipProvider>
          </LoadingProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
