import assert from "node:assert/strict";
import test from "node:test";

import { synthesizeEvidenceBriefings } from "@/lib/ingest/evidence-synthesis";
import { fetchRssStories } from "@/lib/ingest/rss";

async function researchStory(description: string) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      `<?xml version="1.0"?><rss version="2.0"><channel><item>
        <title>Flash flooding forces evacuations at Grand Canyon lodge</title>
        <link>https://example.com/flood</link>
        <description>${description}</description>
        <pubDate>Sun, 31 Aug 2026 12:00:00 GMT</pubDate>
      </item></channel></rss>`,
      { status: 200, headers: { "content-type": "application/rss+xml" } },
    );

  try {
    const [story] = await fetchRssStories("https://example.com/feed.xml", {
      sourceName: "Example News",
      category: "World",
      strict: true,
    });
    return story;
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("publishes a useful original synopsis with audit metadata", async () => {
  const story = await researchStory(
    "A sudden flood struck the lodge area overnight. Officials ordered visitors to higher ground while rescue teams searched damaged buildings.",
  );
  const result = await synthesizeEvidenceBriefings(
    [story],
    new Map([[story.slug, [story]]]),
    async () => ({
      model: "test/model",
      generationId: "gen_test",
      stories: [
        {
          id: story.id,
          summary:
            "According to Example News, overnight flooding damaged the Grand Canyon lodge area and prompted officials to move visitors uphill while crews searched nearby buildings. The immediate questions are whether anyone remains trapped and when the affected area can safely reopen.",
          whatHappened:
            "Example News reports that floodwater reached the lodge area overnight, after which officials directed visitors toward higher ground and rescue personnel began checking damaged structures. The report remains the only evidence supplied for these particulars.",
          whyItMatters:
            "The event presents an immediate life-safety problem and may interrupt access to the surrounding park. Conditions and rescue findings can change as crews reach damaged locations.",
          claims: [
            { text: "Flooding damaged the lodge area.", sourceIndexes: [0] },
            { text: "Visitors were directed uphill.", sourceIndexes: [0] },
          ],
        },
      ],
    }),
  );

  assert.equal(result[0].briefingBasis, "evidence-synthesis");
  assert.match(result[0].summary, /overnight flooding damaged/);
  assert.equal(result[0].synthesis?.generationId, "gen_test");
  assert.equal(result[0].synthesis?.claimCount, 2);
});

test("rejects copied source prose and keeps the legal-safe fallback", async () => {
  const copied =
    "A sudden flood struck the lodge area overnight and officials ordered visitors to higher ground while rescue teams searched damaged buildings for people.";
  const story = await researchStory(copied);
  const result = await synthesizeEvidenceBriefings(
    [story],
    new Map([[story.slug, [story]]]),
    async () => ({
      model: "test/model",
      stories: [
        {
          id: story.id,
          summary: `According to Example News, ${copied} The outcome remains uncertain as crews continue working.`,
          whatHappened: `${copied} Additional information has not yet been independently established by the desk.`,
          whyItMatters:
            "The event presents an immediate safety concern for visitors and responders while conditions remain unsettled.",
          claims: [{ text: "A flood struck the lodge.", sourceIndexes: [0] }],
        },
      ],
    }),
  );

  assert.equal(result[0].briefingBasis, "source-headline");
  assert.doesNotMatch(result[0].summary, new RegExp(copied));
});

test("rejects invented numbers", async () => {
  const story = await researchStory(
    "Flooding reached the lodge and officials moved visitors uphill.",
  );
  const result = await synthesizeEvidenceBriefings(
    [story],
    new Map([[story.slug, [story]]]),
    async () => ({
      model: "test/model",
      stories: [
        {
          id: story.id,
          summary:
            "According to Example News, flooding reached the lodge and officials moved visitors uphill while emergency crews assessed the area. The report says 15 people remain missing, a figure that would materially change the scale of the response.",
          whatHappened:
            "Example News reports that water reached the lodge area and visitors were moved uphill as officials began assessing conditions. No independent confirmation was supplied for the missing-person figure.",
          whyItMatters:
            "The event presents an immediate safety concern while officials determine whether anyone needs assistance and when access can resume.",
          claims: [{ text: "15 people are missing.", sourceIndexes: [0] }],
        },
      ],
    }),
  );

  assert.equal(result[0].briefingBasis, "source-headline");
});

test("keeps duplicate feed entries from one publisher as one evidence source", async () => {
  const first = await researchStory(
    "Flooding reached the lodge and officials moved visitors uphill.",
  );
  const duplicate = await researchStory(
    "Officials moved visitors away from the lodge after flooding reached the area.",
  );

  let receivedSourceCount = 0;
  await synthesizeEvidenceBriefings(
    [first],
    new Map([[first.slug, [first, duplicate]]]),
    async (candidates) => {
      receivedSourceCount = candidates[0]?.sources.length ?? 0;
      return { model: "test/model", stories: [] };
    },
  );

  assert.equal(receivedSourceCount, 1);
});
