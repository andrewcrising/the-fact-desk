import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFastWhyItMatters,
  inferStoryCategory,
} from "@/lib/ingest/fast-briefing";
import {
  MAX_PUBLIC_SUMMARY_CHARS,
  MAX_PUBLIC_WHAT_HAPPENED_CHARS,
  sanitizeStoryForPublic,
} from "@/lib/ingest/public-story";
import type { Story } from "@/types/story";
import { fetchRssStories } from "@/lib/ingest/rss";

function baseStory(overrides: Partial<Story> = {}): Story {
  return {
    id: "live-example",
    slug: "example",
    title: "Agency announces an update",
    summary: "A concise feed synopsis that gives readers useful immediate context.",
    whatHappened: "A concise feed synopsis that gives readers useful immediate context.",
    whyItMatters: "Generic significance text.",
    category: "World",
    confidence: "Single-source",
    signal: "Developing",
    sources: ["Example News"],
    sourceUrls: ["https://example.com/story"],
    publishedAt: "2026-08-31T12:00:00.000Z",
    updatedAt: "2026-08-31T12:00:00.000Z",
    tags: ["live-rss"],
    ...overrides,
  };
}

test("public serialization keeps a useful synopsis but drops article-length body text", () => {
  const distinctiveTail = "DISTINCTIVE-PUBLISHER-BODY-TAIL-SHOULD-NOT-SHIP";
  const longSynopsis = `${"Useful reported context. ".repeat(30)}${distinctiveTail}`;
  const story = baseStory({
    summary: longSynopsis,
    whatHappened: `${"Long publisher body paragraph. ".repeat(120)}${distinctiveTail}`,
  });

  const sanitized = sanitizeStoryForPublic(story);

  assert.ok(sanitized.summary.length <= MAX_PUBLIC_SUMMARY_CHARS);
  assert.ok(sanitized.whatHappened.length <= MAX_PUBLIC_WHAT_HAPPENED_CHARS);
  assert.ok(sanitized.summary.length > 80);
  assert.doesNotMatch(sanitized.summary, new RegExp(distinctiveTail));
  assert.doesNotMatch(sanitized.whatHappened, new RegExp(distinctiveTail));
  assert.match(sanitized.whatHappened, /Example News reports this development/);
});

test("headline inference corrects coarse science and health feed categories", () => {
  assert.equal(
    inferStoryCategory("NASA Webb telescope spots an early galaxy", "Energy"),
    "Technology",
  );
  assert.equal(
    inferStoryCategory("Cancer drug price falls after FDA approval", "Markets"),
    "Health",
  );
  assert.equal(
    inferStoryCategory("Supreme Court agrees to hear privacy case", "World"),
    "Courts",
  );
  assert.equal(
    inferStoryCategory("Defense lawyers withdraw from murder case", "World"),
    "Courts",
  );
  assert.equal(
    inferStoryCategory("Football star retires after World Cup", "World"),
    "Culture",
  );
});

test("headline inference covers live punctuation and topic signals", () => {
  assert.equal(
    inferStoryCategory("Study A.I. Consciousness? The Bots Would Like a Word With You.", "Energy"),
    "Technology",
  );
  assert.equal(
    inferStoryCategory("Trump admin shelves Cyclospora research despite record-breaking outbreak", "Technology"),
    "Health",
  );
  assert.equal(
    inferStoryCategory("Texas Tech head coach blasts USC over poor attendance at LA Coliseum", "Technology"),
    "Culture",
  );
});

test("RSS normalization preserves a natural synopsis boundary", async () => {
  const originalFetch = globalThis.fetch;
  const firstSentence = `${"Rescue teams continued searching the canyon through difficult conditions ".repeat(3).trim()}.`;
  globalThis.fetch = async () =>
    new Response(
      `<?xml version="1.0"?><rss version="2.0"><channel><item>
        <title>Search continues after canyon flooding</title>
        <link>https://example.com/flood</link>
        <description>${firstSentence} This second sentence contains additional background that should not be cut in the middle of a word when the public synopsis reaches its maximum length.</description>
        <pubDate>Mon, 31 Aug 2026 12:00:00 GMT</pubDate>
      </item></channel></rss>`,
      { status: 200, headers: { "content-type": "application/rss+xml" } },
    );

  try {
    const [story] = await fetchRssStories("https://example.com/feed.xml", {
      sourceName: "Example News",
      category: "World",
      strict: true,
    });
    assert.ok(story.summary.length <= MAX_PUBLIC_SUMMARY_CHARS);
    assert.equal(story.summary, `${firstSentence}…`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("court significance cannot be hijacked by unrelated words in feed context", () => {
  const briefing = buildFastWhyItMatters(
    "Supreme Court agrees to hear a federal privacy case",
    "The source synopsis also mentions war, inflation and missing records in background context.",
    "Courts",
  );

  assert.match(briefing, /legal outcome/);
  assert.doesNotMatch(briefing, /near-term security picture/);
  assert.doesNotMatch(briefing, /central-bank policy/);
  assert.doesNotMatch(briefing, /rescue, safety/);
});

test("health story stays health-grounded even when synopsis mentions prices or inflation", () => {
  const story = sanitizeStoryForPublic(
    baseStory({
      title: "Cancer drug price drops after FDA approval",
      summary: "The treatment price is lower after inflation-adjusted negotiations, according to the source.",
      category: "Markets",
    }),
  );

  assert.equal(story.category, "Health");
  assert.match(story.whyItMatters, /treatment options|safety guidance|public-health/);
  assert.doesNotMatch(story.whyItMatters, /central-bank policy/);
});

test("figurative trade-war language is not described as armed conflict", () => {
  const briefing = buildFastWhyItMatters(
    "How the trade war is affecting manufacturers",
    "Tariffs are changing costs on both sides of the border.",
    "Markets",
  );

  assert.match(briefing, /prices, supply chains, energy costs, trade flows/);
  assert.doesNotMatch(briefing, /near-term security picture|further retaliation/);
});

test("invasion of privacy is not described as armed conflict", () => {
  const briefing = buildFastWhyItMatters(
    "Candidate calls license-plate cameras an 'invasion of privacy'",
    "The proposal concerns state policy for automated vehicle tracking cameras.",
    "World",
  );

  assert.doesNotMatch(briefing, /near-term security picture|further retaliation|civilians/);
  assert.match(briefing, /public policy|security|economic conditions|people directly involved/);
});

test("literal missile conflict still receives conflict context", () => {
  const briefing = buildFastWhyItMatters(
    "Countries trade missile attacks as fighting escalates",
    "Officials say additional strikes may follow.",
    "World",
  );

  assert.match(briefing, /near-term security picture|further retaliation/);
});
