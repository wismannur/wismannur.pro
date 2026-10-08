"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to telemetry / console
    console.error("Unhandled runtime error captured by error.tsx boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[200px] bg-primary/15 rounded-full blur-[90px] pointer-events-none -z-10" />

      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-[#0C0E18]/90 border border-white/[0.08] shadow-2xl backdrop-blur-xl">
        {/* Warning Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Something went wrong
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            An unexpected error occurred while processing your request. The engineering incident telemetry has logged this event.
          </p>
          {error.digest && (
            <p className="font-mono text-[11px] text-gray-500 pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto rounded-full gap-2 px-5 text-xs font-semibold shadow-lg shadow-primary/25"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto rounded-full gap-2 px-5 text-xs bg-[#090A0F] border-white/[0.1] text-gray-300 hover:text-white hover:bg-white/[0.06]"
          >
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
