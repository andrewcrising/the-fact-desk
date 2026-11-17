import assert from "node:assert/strict";
import { fetchDiscoveryWithDiagnostics } from "../src/lib/discovery";
import { buildDiscoverySnapshot, summarizeFeedHealth } from "../src/lib/discovery-snapshot";

// Explicit integration gate; fetches public RSS only and never publishes a snapshot.
const result = await fetchDiscoveryWithDiagnostics();
const snapshot = buildDiscoverySnapshot(result, null, "0".repeat(40));
const health = summarizeFeedHealth(snapshot);
console.log("LIVE_DISCOVERY_GATE", JSON.stringify(health));
for (const name of ["NASA", "The Guardian Law"]) {
  const feed = result.feeds.find((f) => f.source === name);
  assert.ok(feed && feed.status === "ok" && feed.count > 0 && feed.count <= 4, `${name} must yield eligible reports`);
}
assert.ok(Object.values(health.categories).every((count) => count > 0), "All eight desks must have reports");
assert.ok(snapshot.stories.length <= 56);
