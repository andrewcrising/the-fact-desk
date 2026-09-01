import type { SocialSourceConfig } from "@/data/socialSources";
import { getEnabledSocialSources } from "@/data/socialSources";
import { cleanFeedText } from "@/lib/ingest/rss";
import type { Story } from "@/types/story";
import type {
  RankedSocialSignal,
  SocialPlatform,
  SocialSignalCandidate,
  SocialSignalDiagnostics,
} from "@/types/social-signal";

const SOCIAL_FETCH_TIMEOUT_MS = 4500;
const MAX_SIGNALS_PER_SOURCE = 8;
const MAX_SOCIAL_STORIES = 8;
const MAX_SIGNAL_AGE_MS = 36 * 60 * 60 * 1000;
const ALLOWED_SOCIAL_HOSTS = new Set(["public.api.bsky.app", "mastodon.social"]);
const STOP_WORDS = new Set([
  "about", "after", "again", "against", "also", "amid", "and", "are", "been", "before",
  "being", "but", "could", "from", "have", "into", "more", "that", "their", "there", "they",
  "this", "through", "under", "with", "would", "your", "https", "http", "www",
]);

function safeSocialUrl(url: URL): URL {
  if (url.protocol !== "https:" || !ALLOWED_SOCIAL_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Unapproved social endpoint");
  }
  return url;
}

function boundedNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 1_000_000_000) : 0;
}

function safeTimestamp(value: unknown): string {
  const now = Date.now();
  const parsed = typeof value === "string" ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(parsed) || parsed > now + 5 * 60 * 1000) return new Date(now).toISOString();
  return new Date(parsed).toISOString();
}

function slugPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function subjectTerms(text: string): string[] {
  const terms = cleanFeedText(text)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[@#]/g, "")
    .split(/[^A-Za-z0-9.'-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 4 && !STOP_WORDS.has(term.toLowerCase()));

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const term of terms) {
    const key = term.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(term);
    if (unique.length >= 8) break;
  }
  return unique;
}

export function socialSignalScore(signal: SocialSignalCandidate, now = Date.now()): number {
  const created = Date.parse(signal.createdAt);
  if (Number.isNaN(created)) return 0;
  const ageHours = Math.max(0, (now - created) / 3_600_000);
  if (ageHours > 48) return 0;

  const engagement =
    Math.log10(1 + signal.engagement.likes) * 7 +
    Math.log10(1 + signal.engagement.reposts) * 11 +
    Math.log10(1 + signal.engagement.replies) * 4 +
    Math.log10(1 + (signal.engagement.quotes ?? 0)) * 6;
  const freshness = Math.max(0, 36 - ageHours) * 1.5;
  const directSourceBonus = signal.directSource ? 10 : 0;
  return Math.round(Math.min(100, engagement + freshness + directSourceBonus));
}

function rankSignals(signals: SocialSignalCandidate[]): RankedSocialSignal[] {
  const now = Date.now();
  return signals
    .filter((signal) => {
      const created = Date.parse(signal.createdAt);
      return !Number.isNaN(created) && now - created <= MAX_SIGNAL_AGE_MS;
    })
    .map((signal) => {
      const score = socialSignalScore(signal, now);
      return {
        ...signal,
        score,
        reason: signal.directSource
          ? "Recent direct-source social post; engagement is a discovery signal, not verification."
          : "Recent public social post ranked by recency and engagement; not independently verified.",
      };
    })
    .sort((a, b) => b.score - a.score || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(safeSocialUrl(url), {
    headers: {
      Accept: "application/json",
      "User-Agent": "TheFactDesk/0.3 (social-signal discovery; linked sources retained)",
    },
    signal: AbortSignal.timeout(SOCIAL_FETCH_TIMEOUT_MS),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`Social endpoint returned ${response.status}`);
  return response.json();
}

async function fetchBlueskyAuthor(source: Extract<SocialSourceConfig, { provider: "bluesky-author" }>): Promise<SocialSignalCandidate[]> {
  const url = new URL("https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed");
  url.searchParams.set("actor", source.actor);
  url.searchParams.set("limit", String(MAX_SIGNALS_PER_SOURCE));
  url.searchParams.set("filter", "posts_no_replies");
  const payload = await fetchJson(url);
  if (!payload || typeof payload !== "object") return [];
  const feed = (payload as { feed?: unknown }).feed;
  if (!Array.isArray(feed)) return [];

  return feed.flatMap((entry): SocialSignalCandidate[] => {
    if (!entry || typeof entry !== "object") return [];
    const post = (entry as { post?: unknown }).post;
    if (!post || typeof post !== "object") return [];
    const record = (post as { record?: unknown }).record;
    const author = (post as { author?: unknown }).author;
    if (!record || typeof record !== "object" || !author || typeof author !== "object") return [];
    const text = cleanFeedText(String((record as { text?: unknown }).text ?? ""));
    if (text.length < 20) return [];
    const uri = String((post as { uri?: unknown }).uri ?? "");
    const rkey = uri.split("/").pop();
    const handle = String((author as { handle?: unknown }).handle ?? source.actor);
    if (!rkey || !handle) return [];
    return [{
      id: `bsky-${slugPart(handle)}-${slugPart(rkey)}`,
      platform: "bluesky",
      account: `@${handle}`,
      displayName: String((author as { displayName?: unknown }).displayName ?? "") || undefined,
      text,
      url: `https://bsky.app/profile/${encodeURIComponent(handle)}/post/${encodeURIComponent(rkey)}`,
      createdAt: safeTimestamp((record as { createdAt?: unknown }).createdAt),
      engagement: {
        likes: boundedNumber((post as { likeCount?: unknown }).likeCount),
        reposts: boundedNumber((post as { repostCount?: unknown }).repostCount),
        replies: boundedNumber((post as { replyCount?: unknown }).replyCount),
        quotes: boundedNumber((post as { quoteCount?: unknown }).quoteCount),
      },
      directSource: source.directSource,
      categoryHint: source.categoryHint,
    }];
  });
}

async function fetchMastodonTag(source: Extract<SocialSourceConfig, { provider: "mastodon-tag" }>): Promise<SocialSignalCandidate[]> {
  const url = new URL(`https://${source.host}/api/v1/timelines/tag/${encodeURIComponent(source.tag)}`);
  url.searchParams.set("limit", String(MAX_SIGNALS_PER_SOURCE));
  const payload = await fetchJson(url);
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((status): SocialSignalCandidate[] => {
    if (!status || typeof status !== "object") return [];
    const account = (status as { account?: unknown }).account;
    if (!account || typeof account !== "object") return [];
    const text = cleanFeedText(String((status as { content?: unknown }).content ?? ""));
    const postUrl = String((status as { url?: unknown }).url ?? "");
    const acct = String((account as { acct?: unknown }).acct ?? "");
    if (text.length < 20 || !postUrl.startsWith("https://") || !acct) return [];
    return [{
      id: `mastodon-${slugPart(String((status as { id?: unknown }).id ?? postUrl))}`,
      platform: "mastodon",
      account: `@${acct}`,
      displayName: cleanFeedText(String((account as { display_name?: unknown }).display_name ?? "")) || undefined,
      text,
      url: postUrl,
      createdAt: safeTimestamp((status as { created_at?: unknown }).created_at),
      engagement: {
        likes: boundedNumber((status as { favourites_count?: unknown }).favourites_count),
        reposts: boundedNumber((status as { reblogs_count?: unknown }).reblogs_count),
        replies: boundedNumber((status as { replies_count?: unknown }).replies_count),
      },
      directSource: false,
      categoryHint: source.categoryHint,
    }];
  });
}

async function fetchConfiguredSource(source: SocialSourceConfig): Promise<SocialSignalCandidate[]> {
  if (source.provider === "bluesky-author") return fetchBlueskyAuthor(source);
  return fetchMastodonTag(source);
}

export async function ingestSocialSignalsWithDiagnostics(
  sources = getEnabledSocialSources(),
): Promise<SocialSignalDiagnostics> {
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        return { source, signals: await fetchConfiguredSource(source), failed: false };
      } catch {
        return { source, signals: [] as SocialSignalCandidate[], failed: true };
      }
    }),
  );
  const ranked = rankSignals(results.flatMap((result) => result.signals));
  const providerCounts: Partial<Record<SocialPlatform, number>> = {};
  for (const signal of ranked) providerCounts[signal.platform] = (providerCounts[signal.platform] ?? 0) + 1;

  return {
    signals: ranked,
    sourcesChecked: sources.length,
    sourcesWithSignals: results.filter((result) => result.signals.length > 0).length,
    failedSourceIds: results.filter((result) => result.failed).map((result) => result.source.id),
    providerCounts,
    fetchedAt: new Date().toISOString(),
  };
}

export function socialSignalToStory(signal: RankedSocialSignal): Story {
  const terms = subjectTerms(signal.text);
  const subject = terms.length > 0 ? terms.join(" ") : "developing event";
  const sourceName = `${signal.platform === "bluesky" ? "Bluesky" : "Mastodon"} ${signal.account}`;
  const createdAt = safeTimestamp(signal.createdAt);
  return {
    id: `social-${signal.id}`,
    slug: `social-${slugPart(signal.id)}`,
    title: `Social signal: ${subject}`,
    summary: `${sourceName} posted about ${terms.slice(0, 6).join(", ") || "a developing event"}. Open the original post for exact wording and context.`,
    whatHappened: `${sourceName} surfaced a public social signal about ${terms.slice(0, 6).join(", ") || "a developing event"}. Fact Desk has not independently established the post's factual claims.`,
    whyItMatters: "Social activity can surface developments before broader reporting, but engagement and repetition are discovery signals rather than proof. Look for primary records or independent reporting before treating the underlying claim as established.",
    category: signal.categoryHint ?? "World",
    confidence: "Single-source",
    signal: "Under-covered",
    sources: [sourceName],
    sourceUrls: [signal.url],
    sourceKinds: ["social"],
    publishedAt: createdAt,
    updatedAt: createdAt,
    tags: ["social-signal", `social:${signal.platform}`, signal.directSource ? "social-direct-source" : "social-public-post"],
    coverageAngle: `${signal.reason} Social-only evidence cannot independently raise Fact Desk confidence or confirm a claim.`,
  };
}

export async function ingestSocialSignalStories(): Promise<Story[]> {
  const result = await ingestSocialSignalsWithDiagnostics();
  return result.signals.slice(0, MAX_SOCIAL_STORIES).map(socialSignalToStory);
}
