export type EntityIdPrefix = "outreach" | "contact" | "service" | "hire";

/**
 * Generates a timestamp-based human-friendly ID in Asia/Jakarta (WIB) timezone.
 * Format: <prefix>-<YYMMDDHHMM>-<5char alphabetical random>
 * Example:
 *  - outreach-2608312230-zfoxq
 *  - contact-2608312230-abcde
 *  - service-2608312230-defgh
 *  - hire-2608312230-ghijk
 */
export function generateEntityId(prefix?: EntityIdPrefix | string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  const yy = getPart("year");
  const mm = getPart("month");
  const dd = getPart("day");
  const hh = getPart("hour");
  const min = getPart("minute");

  // Pure alphabetical characters (a-z) with 5-character length
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let randomPart = "";
  const randomValues = new Uint8Array(5);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 5; i++) {
    randomPart += chars[randomValues[i] % chars.length];
  }

  const timeId = `${yy}${mm}${dd}${hh}${min}-${randomPart}`;
  return prefix ? `${prefix}-${timeId}` : timeId;
}
