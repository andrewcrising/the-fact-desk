import assert from "node:assert/strict";
import test from "node:test";
import { EVALUATION_FEEDS, isEligibleFeedArticle } from "./discovery-feeds";

test("desk-specific feeds reject cross-posted article paths", () => {
  const law = EVALUATION_FEEDS.find((feed) => feed.name === "The Guardian Law");
  assert.ok(law);
  assert.equal(isEligibleFeedArticle(law, "https://www.theguardian.com/law/2026/nov/13/legal-report"), true);
  assert.equal(isEligibleFeedArticle(law, "https://www.theguardian.com/commentisfree/2026/nov/13/editorial"), false);
  assert.equal(isEligibleFeedArticle(law, "not a URL"), false);

  const world = EVALUATION_FEEDS.find((feed) => feed.name === "BBC World");
  assert.ok(world);
  assert.equal(isEligibleFeedArticle(world, "https://www.bbc.co.uk/news/articles/example"), true);
});
