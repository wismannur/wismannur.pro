import { revalidatePath } from "next/cache";

export function cleanJsonText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
  }
  return cleaned.trim();
}

/**
 * Returns current date string (YYYY-MM-DD) in Asia/Jakarta timezone.
 */
export function getJakartaDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

/**
 * Calculates day difference between two YYYY-MM-DD strings in a timezone-independent manner.
 */
export function getDaysDifference(currentDateStr: string, pastDateStr: string): number {
  const [cy, cm, cd] = currentDateStr.split("-").map(Number);
  const [py, pm, pd] = pastDateStr.split("-").map(Number);
  const currentUtc = Date.UTC(cy, cm - 1, cd);
  const pastUtc = Date.UTC(py, pm - 1, pd);
  return Math.round((currentUtc - pastUtc) / (1000 * 60 * 60 * 24));
}

export function revalidateEnglishHubs(): void {
  revalidatePath("/cms/ai-english-gym");
  revalidatePath("/cms/ai-english-academy");
  revalidatePath("/cms/ai-english-fluency");
}
