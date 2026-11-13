/** Feed timestamps must carry a timezone and describe an actual calendar date. */
export function parseFeedTimestamp(value?: string): string | null {
  if (!value) return null;
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/i.exec(text);
  const rfc = /^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+)?(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s+(GMT|UTC|UT|Z|EST|EDT|CST|CDT|MST|MDT|PST|PDT|[+-]\d{2}:?\d{2})$/i.exec(text);
  if (!iso && !rfc) return null;
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const year = Number(iso ? iso[1] : rfc![3]);
  const month = iso ? Number(iso[2]) : monthNames.indexOf(rfc![2].toLowerCase()) + 1;
  const day = Number(iso ? iso[3] : rfc![1]);
  const hour = Number(iso ? iso[4] : rfc![4]);
  const minute = Number(iso ? iso[5] : rfc![5]);
  const second = Number((iso ? iso[6] : rfc![6]) ?? 0);
  const zone = (iso ? iso[7] : rfc![7]).toUpperCase();
  const numericZone = /^[+-](\d{2}):?(\d{2})$/.exec(zone);
  if (numericZone && (Number(numericZone[1]) > 23 || Number(numericZone[2]) > 59)) return null;
  if (year < 1000 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return null;
  if (day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return null;
  // Normalize named zones explicitly: do not depend on the host's local timezone.
  const offsets: Record<string, string> = { GMT: "+0000", UTC: "+0000", UT: "+0000", Z: "+0000", EST: "-0500", EDT: "-0400", CST: "-0600", CDT: "-0500", MST: "-0700", MDT: "-0600", PST: "-0800", PDT: "-0700" };
  const normalized = iso ? text : text.replace(/\S+$/, offsets[zone] ?? zone.replace(":", ""));
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export const MAX_LIVE_STORY_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function isCurrentFeedTimestamp(value: string | undefined, now = Date.now()): boolean {
  const timestamp = parseFeedTimestamp(value);
  if (!timestamp) return false;
  const age = now - Date.parse(timestamp);
  return age >= 0 && age <= MAX_LIVE_STORY_AGE_MS;
}
