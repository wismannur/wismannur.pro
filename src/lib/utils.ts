import { type ClassValue, clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (
  timestamp: { seconds: number; nanoseconds: number } | Date | string | undefined | null
) => {
  if (!timestamp) return "—";

  if (typeof timestamp === "string") {
    return format(parseISO(timestamp), "dd MMM yyyy HH:mm");
  }

  if (timestamp instanceof Date) {
    return format(timestamp, "dd MMM yyyy HH:mm");
  }

  return format(new Date(timestamp.seconds * 1000), "dd MMM yyyy HH:mm");
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}
