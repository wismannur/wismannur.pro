"use client";

import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  redirectPath?: string;
}

/**
 * Client-side route guard (App Router). Real auth would use middleware/server
 * checks; during the mock phase this redirects based on the dummy auth state.
 */
export const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectPath = "/login",
}: ProtectedRouteProps) => {
  const { user, loading: isLoading, error } = useAuth();
  const router = useRouter();

  // Perform redirects as a side-effect once auth has resolved.
  useEffect(() => {
    if (isLoading) return;
    if (requireAuth && !user) {
      router.replace(redirectPath);
    } else if (!requireAuth && user) {
      router.replace("/cms/dashboard");
    }
  }, [isLoading, requireAuth, user, redirectPath, router]);

  // Show loading state
  if (isLoading) {
    return <LoadingOverlay isLoading={true} text="Checking authentication..." fullScreen={false} />;
  }

  // Handle authentication error
  if (error) {
    console.error("Auth error:", error);
    return null;
  }

  // Awaiting redirect (effects above will navigate away).
  if (requireAuth && !user) {
    return <LoadingOverlay isLoading={true} text="Redirecting…" fullScreen={false} />;
  }
  if (!requireAuth && user) {
    return <LoadingOverlay isLoading={true} text="Redirecting…" fullScreen={false} />;
  }

  return <>{children}</>;
};
