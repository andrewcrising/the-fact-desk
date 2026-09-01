import assert from "node:assert/strict";
import test from "node:test";

import { selectNovelEarlySignals, storiesRepresentSameEvent } from "@/lib/ingest/early-signals";
import type { Story } from "@/types/story";

function story(id: string, title: string, options: { social?: boolean; minutesAgo?: number; url?: string; tags?: string[] } = {}): Story {
  const timestamp = new Date(Date.now() - (options.minutesAgo ?? 10) * 60_000).toISOString();
  return {
    id,
    slug: id,
    title,
    summary: title,
    whatHappened: title,
    whyItMatters: "Test significance.",
    category: "World",
    confidence: "Single-source",
    signal: "Under-covered",
    sources: [options.social ? "X breaking-news signal" : "Publisher A"],
    sourceUrls: [options.url ?? `https://example.com/${id}`],
    sourceKinds: [options.social ? "social" : "publisher"],
    publishedAt: timestamp,
    updatedAt: timestamp,
    tags: options.tags ?? (options.social ? ["social-signal", "social:x"] : ["live-rss"]),
  };
}

test("same-event wording is deduped across social and priority stories", () => {
  const social = story("social-1", "Social signal: strong earthquake reported near Harbor City region", { social: true });
  const priority = story("priority-1", "Strong earthquake reported near Harbor City region");
  assert.equal(storiesRepresentSameEvent(social, priority), true);
  assert.deepEqual(selectNovelEarlySignals([social, priority], [priority]), []);
});

test("only recent social/open discovery stories enter the early lane", () => {
  const x = story("x", "New evacuation order issued near coastal wildfire", { social: true, minutesAgo: 5, tags: ["social-signal", "social:x"] });
  const mastodon = story("m", "Transit shutdown reported after downtown explosion", { social: true, minutesAgo: 20, tags: ["social-signal", "social:mastodon"] });
  const old = story("old", "Older social discussion about market policy", { social: true, minutesAgo: 240 });
  const publisher = story("publisher", "Fresh publisher breaking report", { minutesAgo: 2 });

  const selected = selectNovelEarlySignals([publisher, old, mastodon, x]);
  assert.deepEqual(selected.map((item) => item.id), ["x", "m"]);
});

test("duplicates inside the early lane collapse to one event", () => {
  const first = story("first", "Major bridge closes after structural damage reported", { social: true, minutesAgo: 4 });
  const second = story("second", "Structural damage reported as major bridge closes", { social: true, minutesAgo: 5 });
  assert.equal(selectNovelEarlySignals([first, second]).length, 1);
});
