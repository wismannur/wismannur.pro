"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global critical layout error captured by global-error.tsx:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090C] text-gray-200 antialiased min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-[#0C0E18] border border-white/[0.08] shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              System Critical Error
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              A critical failure interrupted the application root layout.
            </p>
            {error.digest && (
              <p className="font-mono text-[11px] text-gray-500 pt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-lg shadow-primary/25 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
