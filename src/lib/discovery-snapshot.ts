import { EVALUATION_FEEDS } from "./discovery-feeds";
import { MAX_FALLBACK_AGE_MS } from "./discovery-cache";
import { isCurrentFeedTimestamp, parseFeedTimestamp } from "./ingest/feed-time";
import { sanitizeStoryForPublic } from "./ingest/public-story";
import { safeArticleUrl } from "./article-source-links";
import type { Story, StoryCategory } from "@/types/story";

export const SNAPSHOT_MAX_BYTES = 512_000;
export const CATEGORIES: StoryCategory[] = ["Politics", "Markets", "Technology", "World", "Health", "Courts", "Energy", "Culture"];
export type FeedAttempt = { url: string; source: string; category: string; count: number; status: string };
export interface FeedHealth extends FeedAttempt {
  status: "ok" | "empty" | "failed";
  lastSuccessAt: string | null;
  consecutiveFailures: number;
}
export interface SnapshotProducer {
  platform: "github-actions";
  event: "schedule" | "workflow_dispatch";
  repository: "andrewcrising/the-fact-desk";
  runId: string;
  runAttempt: number;
  workflowRef: string;
}
export interface DiscoverySnapshot {
  schemaVersion: 1;
  sourceSha: string;
  attemptedAt: string;
  fetchedAt: string | null;
  stories: Story[];
  feeds: FeedHealth[];
  producer: SnapshotProducer | null;
}

const PUBLISHER_DOMAINS: Record<string, string[]> = {
  NPR: ["npr.org"], "BBC World": ["bbc.com", "bbc.co.uk"], "BBC Technology": ["bbc.com", "bbc.co.uk"],
  "BBC Business": ["bbc.com", "bbc.co.uk"], "BBC Health": ["bbc.com", "bbc.co.uk"], "BBC Science": ["bbc.com", "bbc.co.uk"],
  "The Guardian": ["theguardian.com"], "The Guardian Law": ["theguardian.com"], "PBS News": ["pbs.org"],
  "Fox News": ["foxnews.com"], NASA: ["nasa.gov"], "Federal Reserve": ["federalreserve.gov"], "U.S. Department of Justice": ["justice.gov"],
};
function alignedPublisherUrl(source: unknown, input: unknown): boolean {
  if (typeof source !== "string" || typeof input !== "string" || input.length > 2000 || !safeArticleUrl(input)) return false;
  const url = new URL(input);
  return url.protocol === "https:" && !url.port && (PUBLISHER_DOMAINS[source] ?? []).some((root) => url.hostname === root || url.hostname.endsWith(`.${root}`));
}

/** Reconstruct public source reports; persisted input cannot grant editorial status. */
function publicReport(input: unknown, now: number): Story | null {
  if (!input || typeof input !== "object") return null;
  const s = input as Record<string, unknown>;
  const text = (key: string, limit: number) => typeof s[key] === "string" ? (s[key] as string).slice(0, limit) : "";
  if (!text("id", 160) || !text("title", 500) || !CATEGORIES.includes(s.category as StoryCategory) || !isCurrentFeedTimestamp(text("publishedAt", 64), now)) return null;
  if (!Array.isArray(s.sources) || !Array.isArray(s.sourceUrls) || s.sources.length < 1 || s.sources.length > 14 || s.sources.length !== s.sourceUrls.length) return null;
  const names = new Set<string>(EVALUATION_FEEDS.map((f) => f.name));
  const sources = s.sources as unknown[];
  const urls = s.sourceUrls as unknown[];
  if (sources.some((source) => typeof source !== "string" || !names.has(source)) || urls.some((url, index) => !alignedPublisherUrl(sources[index], url))) return null;
  const kinds = sources.map((source) => /NASA|Federal Reserve|Department of Justice/.test(source as string) ? "primary" as const : "publisher" as const);
  return sanitizeStoryForPublic({
    id: text("id", 160), slug: text("slug", 200), title: text("title", 500), summary: text("summary", 280),
    whatHappened: "", whyItMatters: "", category: s.category as StoryCategory,
    confidence: "Single-source", evidenceLevel: "Low", signal: "Developing",
    sources: sources as string[], sourceUrls: urls as string[], sourceKinds: kinds,
    verifiedIndependentOrigins: sources.map(() => null), publishedAt: parseFeedTimestamp(text("publishedAt", 64))!,
    updatedAt: parseFeedTimestamp(text("publishedAt", 64))!, tags: [],
  });
}

/** Strict envelope and calendar boundary. Health remains readable after content expires. */
export function parseDiscoverySnapshot(input: unknown, now = Date.now()): DiscoverySnapshot | null {
  if (!input || typeof input !== "object") return null;
  const s = input as DiscoverySnapshot;
  if (s.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(s.sourceSha ?? "") || typeof s.attemptedAt !== "string" || !parseFeedTimestamp(s.attemptedAt) || Date.parse(s.attemptedAt) > now || !Array.isArray(s.stories) || s.stories.length > 56 || !Array.isArray(s.feeds) || s.feeds.length !== EVALUATION_FEEDS.length) return null;
  if (s.fetchedAt !== null && (typeof s.fetchedAt !== "string" || !parseFeedTimestamp(s.fetchedAt) || Date.parse(s.fetchedAt) > Date.parse(s.attemptedAt))) return null;
  const producer = s.producer ?? null;
  if (producer !== null && (
    typeof producer !== "object" ||
    producer.platform !== "github-actions" ||
    !["schedule", "workflow_dispatch"].includes(producer.event) ||
    producer.repository !== "andrewcrising/the-fact-desk" ||
    !/^\d{1,24}$/.test(producer.runId) ||
    !Number.isInteger(producer.runAttempt) || producer.runAttempt < 1 || producer.runAttempt > 1_000_000 ||
    !/^andrewcrising\/the-fact-desk\/\.github\/workflows\/evaluation-ingestion\.yml@refs\/heads\/[A-Za-z0-9._/-]{1,200}$/.test(producer.workflowRef)
  )) return null;
  const feeds: FeedHealth[] = [];
  for (const feed of EVALUATION_FEEDS) {
    const matches = s.feeds.filter((f) => f && f.url === feed.url);
    if (matches.length !== 1) return null;
    const f = matches[0];
    if (!["ok", "empty", "failed"].includes(f.status) || !Number.isInteger(f.count) || f.count < 0 || f.count > 4 || !Number.isInteger(f.consecutiveFailures) || f.consecutiveFailures < 0 || f.consecutiveFailures > 1_000_000) return null;
    if (f.lastSuccessAt !== null && (typeof f.lastSuccessAt !== "string" || !parseFeedTimestamp(f.lastSuccessAt) || Date.parse(f.lastSuccessAt) > Date.parse(s.attemptedAt))) return null;
    if ((f.status === "ok") !== (f.count > 0) || (f.status === "ok" && (f.lastSuccessAt !== s.attemptedAt || f.consecutiveFailures !== 0)) || (f.status !== "ok" && f.consecutiveFailures < 1)) return null;
    feeds.push({ url: feed.url, source: feed.name, category: feed.category, count: f.count, status: f.status, lastSuccessAt: f.lastSuccessAt, consecutiveFailures: f.consecutiveFailures });
  }
  const decoded = s.stories.map((story) => publicReport(story, now));
  // Reject poison rather than silently accepting a partially forged envelope.
  if (decoded.some((story) => story === null) && s.fetchedAt && now - Date.parse(s.fetchedAt) <= MAX_FALLBACK_AGE_MS) return null;
  const fresh = s.fetchedAt && now - Date.parse(s.fetchedAt) <= MAX_FALLBACK_AGE_MS;
  return { schemaVersion: 1, sourceSha: s.sourceSha, attemptedAt: s.attemptedAt, fetchedAt: s.fetchedAt, stories: fresh ? decoded.filter((story): story is Story => story !== null) : [], feeds, producer };
}

export function buildDiscoverySnapshot(result: { stories: Story[]; feeds: FeedAttempt[] }, previous: DiscoverySnapshot | null, sourceSha: string, now = Date.now(), producer: SnapshotProducer | null = null): DiscoverySnapshot {
  const attemptedAt = new Date(now).toISOString();
  if (previous && Date.parse(previous.attemptedAt) >= now) throw Error("Snapshot attempt must advance monotonically");
  const feeds = EVALUATION_FEEDS.map((feed): FeedHealth => {
    const current = result.feeds.find((f) => f.url === feed.url);
    const prior = previous?.feeds.find((f) => f.url === feed.url);
    const count = current?.status === "ok" ? current.count : 0;
    return { url: feed.url, source: feed.name, category: feed.category, count, status: count ? "ok" : current?.status === "empty" ? "empty" : "failed", lastSuccessAt: count ? attemptedAt : prior?.lastSuccessAt ?? null, consecutiveFailures: count ? 0 : Math.min(1_000_000, (prior?.consecutiveFailures ?? 0) + 1) };
  });
  const snapshot = parseDiscoverySnapshot({ schemaVersion: 1, sourceSha, attemptedAt, fetchedAt: result.stories.length ? attemptedAt : previous?.fetchedAt ?? null, stories: result.stories.length ? result.stories : previous?.stories ?? [], feeds, producer }, now);
  if (!snapshot) throw Error("Invalid ingestion output; previous snapshot must remain untouched");
  return snapshot;
}

export function summarizeFeedHealth(snapshot: DiscoverySnapshot | null, now = Date.now()) {
  if (!snapshot) return { status: "unavailable", schedulerVerified: false, schedulerObserved: false, producer: null, attemptedAt: null, fetchedAt: null, stories: 0, categories: Object.fromEntries(CATEGORIES.map((c) => [c, 0])), feeds: [] };
  const ageMs = now - Date.parse(snapshot.attemptedAt);
  const current = snapshot.fetchedAt !== null && now - Date.parse(snapshot.fetchedAt) <= MAX_FALLBACK_AGE_MS;
  return { status: !current || !snapshot.stories.length || ageMs > MAX_FALLBACK_AGE_MS ? "stale" : snapshot.feeds.some((f) => f.status !== "ok") ? "degraded" : "healthy", schedulerVerified: false, schedulerObserved: snapshot.producer?.event === "schedule", producer: snapshot.producer, sourceSha: snapshot.sourceSha, attemptedAt: snapshot.attemptedAt, fetchedAt: snapshot.fetchedAt, ageMs, stories: snapshot.stories.length, categories: Object.fromEntries(CATEGORIES.map((c) => [c, snapshot.stories.filter((s) => s.category === c).length])), feeds: snapshot.feeds };
}
