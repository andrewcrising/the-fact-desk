import assert from "node:assert/strict";
import test from "node:test";
import { isCurrentFeedTimestamp, parseFeedTimestamp } from "./feed-time";
import { fetchRssFeedItems, fetchRssStories } from "./rss";

test("feed dates reject impossible calendars and unknown timezones", () => {
  for (const value of [undefined, "", "2026-02-30T00:00:00Z", "31 Apr 2026 12:00:00 GMT", "2026-11-13T24:00:00Z", "2026-11-13T12:00:00+24:00", "Fri, 13 Nov 2026 12:00:00 WAT", "2026-11-13", "11/13/2026 - 12:00 PM"]) {
    assert.equal(parseFeedTimestamp(value), null, String(value));
  }
  assert.equal(parseFeedTimestamp("29 Feb 2024 12:00:00 GMT"), "2024-02-29T12:00:00.000Z");
  assert.equal(parseFeedTimestamp("Fri, 13 Nov 2026 07:00:00 EST"), "2026-11-13T12:00:00.000Z");
  assert.equal(parseFeedTimestamp("2026-11-13T13:00:00+01:00"), "2026-11-13T12:00:00.000Z");
  assert.equal(isCurrentFeedTimestamp("2026-11-13T12:00:01Z", Date.parse("2026-11-13T12:00:00Z")), false);
});

test("live validation precedes limit while the editorial inbox retains undated inputs", async () => {
  const original = globalThis.fetch;
  const date = new Date(Date.now() - 1000).toUTCString();
  const item = (title: string, date: string, link = "https://publisher.example/report") => `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate></item>`;
  globalThis.fetch = async () => new Response(`<rss><channel>${item("Undated", "")}${item("Unsafe", date, "javascript:alert(1)")}${item("Invalid", "2026-02-30T00:00:00Z")}${item("Eligible", date)}</channel></rss>`);
  try {
    const live = await fetchRssStories("https://publisher.example/rss", { limit: 1 });
    assert.deepEqual(live.map((s) => s.title), ["Eligible"]);
    assert.equal((await fetchRssFeedItems("https://publisher.example/rss", 4))[0].pubDate, undefined);
  } finally { globalThis.fetch = original; }
});
