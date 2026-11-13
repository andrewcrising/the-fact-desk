import assert from "node:assert/strict";
import test from "node:test";
import { stories } from "@/data/stories";
import { EVALUATION_FEEDS } from "./discovery-feeds";
import { buildDiscoverySnapshot, parseDiscoverySnapshot, summarizeFeedHealth, type DiscoverySnapshot } from "./discovery-snapshot";
import { createSnapshotReader, getScheduledSnapshot, loadEvaluationSnapshot } from "./scheduled-discovery";
import { MAX_FALLBACK_AGE_MS } from "./discovery-cache";
const now = Date.parse("2026-11-13T16:00:00Z");
const sourceSha = "a".repeat(40);
const report = { ...stories[0], sources: ["BBC World"], sourceUrls: ["https://www.bbc.com/news/articles/example"], publishedAt: new Date(now - 1000).toISOString(), category: "World" as const };
const feeds = EVALUATION_FEEDS.map((f) => ({ url: f.url, source: f.name, category: f.category, count: 1, status: "ok" }));
const snapshot = () => buildDiscoverySnapshot({ stories: [report], feeds }, null, sourceSha, now);

test("durable envelope forces source-only provenance and reconstructs bounded public fields", () => {
  const input = snapshot();
  const poisoned = { ...input, token: "never-serialize", stories: [{ ...report, signal: "Top Signal", confidence: "Confirmed", evidenceLevel: "Strong", verifiedIndependentOrigins: ["invented"], secret: "never-serialize" }] };
  const parsed = parseDiscoverySnapshot(poisoned, now)!;
  assert.equal(parsed.stories[0].signal, "Developing");
  assert.equal(parsed.stories[0].confidence, "Single-source");
  assert.deepEqual(parsed.stories[0].verifiedIndependentOrigins, [null]);
  assert.equal(JSON.stringify(parsed).includes("never-serialize"), false);
  assert.equal(summarizeFeedHealth(parsed, now).status, "healthy");
  assert.equal(summarizeFeedHealth(parsed, now).categories.World, 1);
});

test("outage preserves the content timestamp, increments per-feed failures and expires content", () => {
  const first = snapshot();
  const failed = buildDiscoverySnapshot({ stories: [], feeds: [] }, first, sourceSha, now + 60_000);
  assert.equal(failed.fetchedAt, first.fetchedAt);
  assert.equal(failed.stories.length, 1);
  assert.equal(failed.feeds[0].lastSuccessAt, first.attemptedAt);
  assert.equal(failed.feeds[0].consecutiveFailures, 1);
  assert.equal(summarizeFeedHealth(failed, now + 60_000).status, "degraded");
  const expired = buildDiscoverySnapshot({ stories: [], feeds: [] }, failed, sourceSha, now + MAX_FALLBACK_AGE_MS + 1);
  assert.equal(expired.fetchedAt, first.fetchedAt);
  assert.equal(expired.stories.length, 0);
  assert.equal(summarizeFeedHealth(expired, now + MAX_FALLBACK_AGE_MS + 1).status, "stale");
  assert.equal(expired.feeds[0].consecutiveFailures, 2);
  const recovered = buildDiscoverySnapshot({ stories: [report], feeds }, expired, sourceSha, now + MAX_FALLBACK_AGE_MS + 2);
  assert.equal(recovered.feeds[0].consecutiveFailures, 0);
  assert.equal(recovered.feeds[0].lastSuccessAt, recovered.attemptedAt);
});

test("rejects invalid envelopes, timestamp lies, unsafe URLs and publisher-link mismatch", () => {
  const good = snapshot();
  const bad = [
    { ...good, schemaVersion: 2 }, { ...good, attemptedAt: 42 }, { ...good, fetchedAt: {} }, { ...good, attemptedAt: "2026-02-30T00:00:00Z" },
    { ...good, attemptedAt: new Date(now + 1).toISOString() }, { ...good, fetchedAt: new Date(now + 1).toISOString() },
    { ...good, feeds: [...good.feeds.slice(1), good.feeds[1]] },
    { ...good, feeds: good.feeds.map((f, i) => i ? f : { ...f, consecutiveFailures: -1 }) },
    ...["javascript:alert(1)", "https://127.0.0.1/test", "https://www.bbc.com.attacker.test/", "https://user:pass@bbc.com/", "https://bbc.com:444/", "https://www.foxnews.com/article"].map((url) => ({ ...good, stories: [{ ...report, sourceUrls: [url] }] })),
    { ...good, stories: [{ ...report, publishedAt: "2020-01-01T00:00:00Z" }] },
  ];
  for (const value of bad) assert.equal(parseDiscoverySnapshot(value, now), null);
  assert.throws(() => buildDiscoverySnapshot({ stories: [report], feeds }, good, sourceSha, now), /monotonically/);
});

test("independent readers recover durable content; failed reads never rejuvenate timestamps", async () => {
  let time = now;
  let calls = 0;
  let fail = false;
  const load = async () => { calls++; if (fail) throw Error("storage offline"); return snapshot(); };
  const first = createSnapshotReader(load, () => time);
  const values = await Promise.all([first(), first(), first()]);
  assert.equal(calls, 1);
  assert.equal(values[0]?.stories.length, 1);
  const second = createSnapshotReader(load, () => time);
  assert.equal((await second())?.fetchedAt, values[0]?.fetchedAt);
  time += 60_001; fail = true;
  assert.equal((await first())?.fetchedAt, values[0]?.fetchedAt);
  await first(); assert.equal(calls, 3);
  time += MAX_FALLBACK_AGE_MS;
  assert.equal((await first())?.stories.length, 0);
});

test("snapshot reader rejects rollbacks and fences older in-flight results", async () => {
  const newer = { ...snapshot(), attemptedAt: new Date(now + 1000).toISOString(), fetchedAt: new Date(now + 1000).toISOString(), feeds: snapshot().feeds.map((f) => ({ ...f, lastSuccessAt: new Date(now + 1000).toISOString() })) };
  const releases: Array<(s: DiscoverySnapshot) => void> = [];
  const reader = createSnapshotReader(() => new Promise((resolve) => releases.push(resolve)), () => now + 2000);
  const old = reader(); reader.invalidate(); const current = reader();
  releases[1](newer); assert.equal((await current)?.attemptedAt, newer.attemptedAt);
  releases[0](snapshot()); assert.equal((await old)?.attemptedAt, newer.attemptedAt);
  reader.invalidate(); const rollback = reader(); releases[2](snapshot());
  assert.equal((await rollback)?.attemptedAt, newer.attemptedAt);
});

test("production cannot opt into evaluation storage; disabled previews perform no fetch", async () => {
  const previous = { ...process.env };
  try {
    delete process.env.FACT_DESK_PREVIEW_ISOLATED;
    process.env.VERCEL_ENV = "production";
    process.env.FACT_DESK_SCHEDULED_DISCOVERY = "true";
    assert.equal(await getScheduledSnapshot(), null);
    process.env.VERCEL_ENV = "preview";
    delete process.env.FACT_DESK_SCHEDULED_DISCOVERY;
    assert.equal(await getScheduledSnapshot(), null);
  } finally { process.env = previous; }
});

test("remote snapshot reads use only the fixed HTTPS origin and enforce streamed body limits", async () => {
  const original = globalThis.fetch;
  let cancelled = false;
  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(String(input), "https://raw.githubusercontent.com/andrewcrising/the-fact-desk/data/evaluation-live-feed/discovery.json");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      return new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(512_001)); }, cancel() { cancelled = true; } }));
    };
    await assert.rejects(loadEvaluationSnapshot(), /too large/);
    assert.equal(cancelled, true);
    globalThis.fetch = async () => new Response("bad", { headers: { "Content-Length": "512001" } });
    await assert.rejects(loadEvaluationSnapshot(), /unavailable/);
    globalThis.fetch = async () => new Response("not-json");
    await assert.rejects(loadEvaluationSnapshot(), SyntaxError);
  } finally { globalThis.fetch = original; }
});
