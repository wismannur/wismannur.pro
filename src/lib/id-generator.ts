export type EntityIdPrefix = "outreach" | "contact" | "service" | "hire";

/**
 * Generates a timestamp-based human-friendly ID in Asia/Jakarta (WIB) timezone.
 * Format: <prefix>-<YYMMDDHHMM>-<3char random>
 * Example:
 *  - outreach-2608312230-zfo
 *  - contact-2608312230-abc
 *  - service-2608312230-def
 *  - hire-2608312230-ghi
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

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  const randomValues = new Uint8Array(3);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 3; i++) {
    randomPart += chars[randomValues[i] % chars.length];
  }

  const timeId = `${yy}${mm}${dd}${hh}${min}-${randomPart}`;
  return prefix ? `${prefix}-${timeId}` : timeId;
}
