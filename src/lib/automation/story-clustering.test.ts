import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clusterFeedItems } from "@/lib/automation/story-clustering";

describe("story clustering", () => {
  it("groups duplicate canonical URLs", () => {
    const clusters = clusterFeedItems([
      {
        id: "a",
        title: "Agency releases new grid reliability rule",
        canonicalUrl: "https://example.com/grid-rule",
      },
      {
        id: "b",
        title: "Grid reliability rule released by agency",
        canonicalUrl: "https://example.com/grid-rule",
      },
    ]);

    assert.equal(clusters.length, 1);
    assert.deepEqual(clusters[0].feed_item_ids.sort(), ["a", "b"]);
  });

  it("groups similar titles with shared key terms", () => {
    const clusters = clusterFeedItems([
      {
        id: "a",
        title: "Regulator delays battery storage procurement approval",
        canonicalUrl: "https://a.example/story",
      },
      {
        id: "b",
        title: "Battery storage procurement approval delayed by regulator",
        canonicalUrl: "https://b.example/story",
      },
      {
        id: "c",
        title: "Court schedules digital evidence arguments",
        canonicalUrl: "https://c.example/story",
      },
    ]);

    assert.equal(clusters.length, 2);
    assert.ok(clusters.some((cluster) => cluster.feed_item_ids.length === 2));
  });
});
