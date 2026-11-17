import { createHash } from "node:crypto";
import { EVALUATION_FEEDS, isEligibleFeedArticle } from "../src/lib/discovery-feeds";
import { parseRssItems, readBoundedRssBody } from "../src/lib/ingest/rss";
import { isCurrentFeedTimestamp } from "../src/lib/ingest/feed-time";
import { safeArticleUrl } from "../src/lib/article-source-links";

// Public upstream diagnostics only: no credentials, publishing, or production writes.
for (const name of ["NASA", "The Guardian Law"]) {
  const feed = EVALUATION_FEEDS.find((f) => f.name === name)!;
  try {
    const response = await fetch(feed.url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml, */*", "User-Agent": "TheFactDesk/0.2 (RSS editorial ingest)" },
      signal: AbortSignal.timeout(5000),
    });
    const xml = await readBoundedRssBody(response, 2_000_000);
    const items = parseRssItems(xml);
    const current = items.filter((item) => isCurrentFeedTimestamp(item.pubDate) && safeArticleUrl(item.link));
    console.log("UPSTREAM_DIAGNOSTIC", JSON.stringify({
      name, url: feed.url, finalUrl: response.url, status: response.status,
      type: response.headers.get("content-type"), declaredBytes: response.headers.get("content-length"),
      decodedBytes: Buffer.byteLength(xml), sha256: createHash("sha256").update(xml).digest("hex"),
      parsed: items.length, currentSafe: current.length,
      eligibleBeforeLimit: current.filter((item) => isEligibleFeedArticle(feed, item.link!)).length,
      eligibleAfterLimit: current.slice(0, 4).filter((item) => isEligibleFeedArticle(feed, item.link!)).length,
      firstLinks: current.slice(0, 12).map((item) => ({ link: item.link, date: item.pubDate, eligible: isEligibleFeedArticle(feed, item.link!) })),
    }));
  } catch (error) {
    console.log("UPSTREAM_DIAGNOSTIC", JSON.stringify({ name, url: feed.url, error: error instanceof Error ? error.message : String(error) }));
  }
}
