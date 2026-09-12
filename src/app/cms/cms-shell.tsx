"use client";

import type React from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CmsLayout } from "@/components/layout/cms-layout";

export function CmsShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      <CmsLayout>{children}</CmsLayout>
    </ProtectedRoute>
  );
}
