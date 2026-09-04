import { getEnabledFeeds, RSS_FEEDS, type RssFeedConfig } from "../src/data/rssFeeds";
import { parseRssItems } from "../src/lib/ingest/rss";

const strict = process.argv.includes("--strict");
const includeDisabled = process.argv.includes("--all");
const timeoutMs = 15_000;
const staleAfterDays = 45;

interface FeedHealthResult {
  id: string;
  source: string;
  enabled: boolean;
  url: string;
  ok: boolean;
  stale: boolean;
  status: number | null;
  contentType: string | null;
  itemCount: number;
  latestPublishedAt: string | null;
  message: string;
}

function latestPublishedAt(items: ReturnType<typeof parseRssItems>): string | null {
  const timestamps = items
    .map((item) => (item.pubDate ? Date.parse(item.pubDate) : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function isStale(latest: string | null): boolean {
  if (!latest) return false;
  const ageMs = Date.now() - Date.parse(latest);
  return ageMs > staleAfterDays * 24 * 60 * 60 * 1000;
}

async function checkFeed(feed: RssFeedConfig): Promise<FeedHealthResult> {
  try {
    const response = await fetch(feed.feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*",
        "User-Agent": "TheFactDesk/0.1 (feed health check)",
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();
    const items = response.ok ? parseRssItems(body) : [];
    const latest = latestPublishedAt(items);
    const stale = isStale(latest);
    const ok = response.ok && items.length > 0;

    return {
      id: feed.id,
      source: feed.sourceName,
      enabled: feed.enabled,
      url: feed.feedUrl,
      ok,
      stale,
      status: response.status,
      contentType,
      itemCount: items.length,
      latestPublishedAt: latest,
      message: !ok
        ? response.ok
          ? "request succeeded but no RSS/Atom items parsed"
          : `HTTP ${response.status}`
        : stale
          ? `feed parsed but newest dated item is older than ${staleAfterDays} days`
          : "feed parsed successfully",
    };
  } catch (error) {
    return {
      id: feed.id,
      source: feed.sourceName,
      enabled: feed.enabled,
      url: feed.feedUrl,
      ok: false,
      stale: false,
      status: null,
      contentType: null,
      itemCount: 0,
      latestPublishedAt: null,
      message: error instanceof Error ? error.message : "unknown feed-health error",
    };
  }
}

async function main() {
  const feeds = includeDisabled ? RSS_FEEDS : getEnabledFeeds();
  const results: FeedHealthResult[] = [];

  for (const feed of feeds) {
    const result = await checkFeed(feed);
    results.push(result);
    const state = !result.ok ? "FAIL" : result.stale ? "STALE" : "OK";
    console.log(
      `[feed-health] ${state} ${result.source} enabled=${result.enabled} status=${result.status ?? "n/a"} items=${result.itemCount} latest=${result.latestPublishedAt ?? "n/a"} ${result.message}`,
    );
  }

  const failed = results.filter((result) => !result.ok);
  const stale = results.filter((result) => result.stale);
  const unhealthyEnabled = results.filter(
    (result) => result.enabled && (!result.ok || result.stale),
  );

  console.log(
    `[feed-health] summary checked=${results.length} healthy=${results.length - failed.length - stale.length} failed=${failed.length} stale=${stale.length} unhealthy_enabled=${unhealthyEnabled.length}`,
  );
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));

  if (strict && unhealthyEnabled.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = strict ? 1 : 0;
});
