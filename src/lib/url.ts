export function canonicalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (
        key.toLowerCase().startsWith("utm_") ||
        ["fbclid", "gclid", "mc_cid", "mc_eid"].includes(key.toLowerCase())
      ) {
        url.searchParams.delete(key);
      }
    }
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/$/, "");
  } catch {
    return input.trim();
  }
}

export function urlOrigin(input: string): string | null {
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

export function buildDedupeKey(input: {
  sourceId?: string;
  title: string;
  canonicalUrl?: string;
  publishedAt?: string | null;
}): string {
  const normalizedTitle = input.title.toLowerCase().replace(/\s+/g, " ").trim();
  const day = input.publishedAt ? input.publishedAt.slice(0, 10) : "undated";
  return [
    input.sourceId ?? "unknown-source",
    input.canonicalUrl?.toLowerCase() ?? normalizedTitle,
    day,
  ].join("::");
}
