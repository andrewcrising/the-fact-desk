import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMultiSourceHouseBriefing,
  buildSingleSourceHouseBriefing,
  sanitizeLiveStoryForDisplay,
} from "@/lib/ingest/editorial-firewall";
import { fetchRssStories } from "@/lib/ingest/rss";
import type { Story } from "@/types/story";

const distinctivePublisherLede =
  "A vividly crafted publisher sentence with unmistakable prose that should never appear in Fact Desk copy.";

test("single-source briefing is independent and keeps the claim attributed", () => {
  const briefing = buildSingleSourceHouseBriefing({
    sourceName: "Example News",
    category: "Politics",
    whyItMatters:
      "This may affect government policy and implementation. Later developments could change the impact.",
  });

  assert.match(briefing.summary, /^Example News is reporting/);
  assert.match(briefing.whatHappened, /keeping the claim attributed/);
  assert.doesNotMatch(briefing.summary, new RegExp(distinctivePublisherLede));
  assert.doesNotMatch(briefing.whatHappened, new RegExp(distinctivePublisherLede));
});

test("multi-source briefing does not inherit the longest publisher synopsis", () => {
  const representative: Story = {
    id: "example",
    slug: "example",
    title: "Officials announce a material policy change",
    summary: distinctivePublisherLede,
    whatHappened: distinctivePublisherLede,
    whyItMatters:
      "This may affect government policy and implementation. Later developments could change the impact.",
    category: "Politics",
    confidence: "Single-source",
    signal: "Developing",
    sources: ["Example News"],
    publishedAt: "2026-08-31T12:00:00.000Z",
    updatedAt: "2026-08-31T12:00:00.000Z",
    tags: [],
  };

  const briefing = buildMultiSourceHouseBriefing({
    representative,
    sources: ["Example News", "Second News"],
  });

  assert.match(briefing.summary, /2 publishers/);
  assert.match(briefing.whatHappened, /does not independently verify/);
  assert.ok(!briefing.summary.includes(distinctivePublisherLede));
  assert.ok(!briefing.whatHappened.includes(distinctivePublisherLede));
});

test("legacy cached copy is replaced before display", () => {
  const legacy: Story = {
    id: "legacy",
    slug: "legacy",
    title: "Agency issues a new public advisory",
    summary: distinctivePublisherLede,
    whatHappened: distinctivePublisherLede,
    whyItMatters:
      "This may affect public safety decisions. Additional guidance may follow.",
    category: "Health",
    confidence: "Single-source",
    signal: "Developing",
    sources: ["Example News"],
    publishedAt: "2026-08-31T12:00:00.000Z",
    updatedAt: "2026-08-31T12:00:00.000Z",
    tags: ["live-rss"],
  };

  const sanitized = sanitizeLiveStoryForDisplay(legacy);

  assert.equal(sanitized.briefingBasis, "source-headline");
  assert.equal(sanitized.headlineSource, "Example News");
  assert.ok(!sanitized.summary.includes(distinctivePublisherLede));
  assert.ok(!sanitized.whatHappened.includes(distinctivePublisherLede));
});

test("RSS ingestion uses a description for significance without publishing its prose", async () => {
  const originalFetch = globalThis.fetch;
  const xml = `<?xml version="1.0"?>
    <rss version="2.0"><channel><item>
      <title>Flash floods force evacuations near a national park</title>
      <link>https://example.com/flood</link>
      <description>${distinctivePublisherLede} Rescue crews are searching for missing visitors.</description>
      <pubDate>Sun, 31 Aug 2026 12:00:00 GMT</pubDate>
    </item></channel></rss>`;

  globalThis.fetch = async () =>
    new Response(xml, {
      status: 200,
      headers: { "content-type": "application/rss+xml" },
    });

  try {
    const [story] = await fetchRssStories("https://example.com/feed.xml", {
      sourceName: "Example News",
      category: "World",
      strict: true,
    });

    assert.ok(story);
    assert.ok(!story.summary.includes(distinctivePublisherLede));
    assert.ok(!story.whatHappened.includes(distinctivePublisherLede));
    assert.match(story.whyItMatters, /rescue, safety/);
    assert.equal(story.headlineSource, "Example News");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
