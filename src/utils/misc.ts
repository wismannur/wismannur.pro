import clsx, { ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Create a twMerge utility that respects the tailwind.config.ts color settings.
const twMerge = extendTailwindMerge({
  prefix: "tw-",
});

/**
 * Utility to construct className strings conditionally
 * that can also efficiently merge Tailwind CSS classes in JS
 * without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
