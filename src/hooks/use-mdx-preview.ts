"use client";

import { useEffect, useState } from "react";

interface UseMDXPreviewOptions {
  initialCode?: string;
  delay?: number;
}

export function useMDXPreview({ initialCode = "", delay = 300 }: UseMDXPreviewOptions = {}) {
  const [code, setCode] = useState(initialCode);
  const [parsedCode, setParsedCode] = useState(initialCode);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setParsedCode(code);
        setError(null);
      } catch (err) {
        console.error("Error parsing MDX:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [code, delay]);

  const isLoading = code !== parsedCode;

  return {
    code,
    setCode,
    parsedCode,
    isLoading,
    error,
  };
}
