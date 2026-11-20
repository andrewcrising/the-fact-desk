import assert from "node:assert/strict";
import test from "node:test";
import { createSnapshotReader } from "./scheduled-discovery";

test("invalid scheduled snapshot is retried only after bounded backoff", async () => {
  let now = Date.parse("2026-11-19T12:00:00Z");
  let calls = 0;
  const reader = createSnapshotReader(async () => { calls++; return null; }, () => now);
  assert.equal(await reader(), null);
  assert.equal(await reader(), null);
  assert.equal(calls, 1, "missing snapshot must not trigger request-time fetch fanout");
  now += 30_001;
  assert.equal(await reader(), null);
  assert.equal(calls, 2);
});

test("rejected scheduled snapshot loads fail closed without per-reader retry", async () => {
  let now = Date.parse("2026-11-19T12:00:00Z");
  let calls = 0;
  const reader = createSnapshotReader(async () => { calls++; throw Error("unavailable"); }, () => now);
  const results = await Promise.all([reader(), reader(), reader()]);
  assert.deepEqual(results, [null, null, null]);
  assert.equal(calls, 1);
  assert.equal(await reader(), null);
  assert.equal(calls, 1);
  now += 30_001;
  assert.equal(await reader(), null);
  assert.equal(calls, 2);
});

test("invalidation fences pending snapshot results and permits a new load", async () => {
  const now = Date.parse("2026-11-19T12:00:00Z");
  const releases: Array<(value: unknown) => void> = [];
  const reader = createSnapshotReader(() => new Promise((resolve) => releases.push(resolve)), () => now);
  const older = reader();
  reader.invalidate();
  const newer = reader();
  // The loader is invoked in a microtask so synchronous exceptions become rejections.
  await Promise.resolve();
  assert.equal(releases.length, 2);
  releases[0](null);
  assert.equal(await older, null);
  releases[1](null);
  assert.equal(await newer, null);
});

test("synchronous snapshot loader exceptions fail closed and respect retry backoff", async () => {
  let now = Date.parse("2026-11-20T06:00:00Z");
  let calls = 0;
  const reader = createSnapshotReader(() => { calls++; throw Error("synchronous failure"); }, () => now);
  assert.deepEqual(await Promise.all([reader(), reader(), reader()]), [null, null, null]);
  assert.equal(calls, 1);
  assert.equal(await reader(), null);
  assert.equal(calls, 1);
  now += 30_001;
  assert.equal(await reader(), null);
  assert.equal(calls, 2);
});
