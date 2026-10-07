"use client";

import React from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export function toast(options: ToastOptions | string) {
  if (typeof options === "string") {
    return sonnerToast(options);
  }

  const { title, description, variant } = options;

  if (variant === "destructive") {
    return sonnerToast.error((title as string) || "Error", {
      description: description as string,
    });
  }

  return sonnerToast.success((title as string) || "Success", {
    description: description as string,
  });
}

export function useToast() {
  return {
    toast,
    dismiss: () => sonnerToast.dismiss(),
    toasts: [],
  };
}
