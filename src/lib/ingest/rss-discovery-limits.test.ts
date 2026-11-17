import assert from "node:assert/strict";
import test from "node:test";
import { fetchRssStories } from "./rss";

function item(url: string) {
  return `<item><title>A current source report</title><link>${url}</link><pubDate>${new Date(Date.now() - 1000).toUTCString()}</pubDate></item>`;
}

test("an explicitly bounded large feed can be read without widening the default limit", async () => {
  const original = globalThis.fetch;
  const xml = `<rss><channel>${item("https://www.nasa.gov/news-release/current-report/")}<!--${" ".repeat(288224)}--></channel></rss>`;
  globalThis.fetch = async () => new Response(xml);
  try {
    const options = { sourceName: "NASA", category: "Technology", strict: true, maxBodyBytes: 524288 };
    assert.equal((await fetchRssStories("https://www.nasa.gov/news-release/feed/", options)).length, 1);
    await assert.rejects(fetchRssStories("https://example.com/feed", { strict: true }), /size limit/);
    globalThis.fetch = async () => new Response(" ".repeat(524289));
    await assert.rejects(fetchRssStories("https://www.nasa.gov/news-release/feed/", options), /size limit/);
  } finally { globalThis.fetch = original; }
});

test("desk eligibility is applied before the per-feed quota without admitting unrelated paths", async () => {
  const original = globalThis.fetch;
  const unrelated = Array.from({ length: 4 }, (_, i) => item(`https://www.theguardian.com/news/report-${i}`));
  const eligible = Array.from({ length: 5 }, (_, i) => item(`https://www.theguardian.com/law/report-${i}`));
  globalThis.fetch = async () => new Response(`<rss><channel>${[...unrelated, ...eligible].join("")}</channel></rss>`);
  try {
    const options = { sourceName: "The Guardian Law", category: "Courts", strict: true, limit: 4,
      isEligibleArticle: (url: string) => new URL(url).pathname.startsWith("/law/") };
    const stories = await fetchRssStories("https://www.theguardian.com/law/rss", options);
    assert.equal(stories.length, 4);
    assert.ok(stories.every((story) => new URL(story.sourceUrls![0]).pathname.startsWith("/law/")));
  } finally { globalThis.fetch = original; }
});
