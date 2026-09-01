import type { XNewsSourceConfig } from "@/data/socialSources";
import { cleanFeedText } from "@/lib/ingest/rss";
import type { SocialSignalCandidate } from "@/types/social-signal";

const X_API_HOST = "api.x.com";
const X_TIMEOUT_MS = 4500;
const X_MAX_RESULTS = 8;
const X_MAX_AGE_HOURS = 6;

function safeTimestamp(value: unknown): string {
  const now = Date.now();
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(parsed) || parsed > now + 5 * 60_000) return new Date(now).toISOString();
  return new Date(parsed).toISOString();
}

function slugPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export async function fetchXNewsSignals(source: XNewsSourceConfig): Promise<SocialSignalCandidate[]> {
  const token = process.env.FACT_DESK_X_BEARER_TOKEN?.trim();
  if (!token) return [];

  const url = new URL("https://api.x.com/2/news/search");
  if (url.protocol !== "https:" || url.hostname !== X_API_HOST) {
    throw new Error("Unapproved X API endpoint");
  }
  url.searchParams.set("query", source.query);
  url.searchParams.set("max_results", String(X_MAX_RESULTS));
  url.searchParams.set("max_age_hours", String(X_MAX_AGE_HOURS));
  url.searchParams.set("news.fields", "category,cluster_posts_results,id,name,updated_at");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "TheFactDesk/0.3",
    },
    signal: AbortSignal.timeout(X_TIMEOUT_MS),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`X endpoint returned ${response.status}`);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  return data.flatMap((item): SocialSignalCandidate[] => {
    if (!item || typeof item !== "object") return [];
    const id = String((item as { id?: unknown }).id ?? "");
    const name = cleanFeedText(String((item as { name?: unknown }).name ?? ""));
    const posts = (item as { cluster_posts_results?: unknown }).cluster_posts_results;
    const firstPost = Array.isArray(posts)
      ? posts.find((post) => post && typeof post === "object" && (post as { post_id?: unknown }).post_id)
      : undefined;
    const firstPostId = firstPost && typeof firstPost === "object"
      ? String((firstPost as { post_id?: unknown }).post_id ?? "")
      : "";
    if (!id || name.length < 12 || !firstPostId) return [];

    return [{
      id: `x-news-${slugPart(id)}`,
      platform: "x",
      account: "X News cluster",
      displayName: "X",
      text: name,
      url: `https://x.com/i/web/status/${encodeURIComponent(firstPostId)}`,
      createdAt: safeTimestamp((item as { updated_at?: unknown }).updated_at),
      engagement: { likes: 0, reposts: 0, replies: 0, quotes: 0 },
      directSource: false,
      categoryHint: source.categoryHint,
    }];
  });
}
