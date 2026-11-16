import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { stories } from "@/data/stories";
import { EVALUATION_FEEDS } from "./discovery-feeds";
import { buildDiscoverySnapshot } from "./discovery-snapshot";
import { githubSnapshotProducer, produceSnapshotFile, publishSnapshot, readSnapshotHead } from "../../scripts/evaluation-snapshot-store";
const sourceSha = "b".repeat(40);
const now = Date.now() - 120_000;
const result = { stories: [{ ...stories[0], sources: ["BBC World"], sourceUrls: ["https://www.bbc.com/news/articles/example"], publishedAt: new Date(now - 1000).toISOString() }], feeds: EVALUATION_FEEDS.map((f) => ({ url: f.url, source: f.name, category: f.category, count: 1, status: "ok" })) };

test("atomic file ingestion survives restart and failed production without corrupting prior data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "factdesk-ingest-"));
  try {
    const first = await produceSnapshotFile({ directory, sourceSha, fetch: async () => result, now: () => now });
    const second = await produceSnapshotFile({ directory, sourceSha, fetch: async () => ({ stories: [], feeds: [] }), now: () => now + 1000 });
    assert.equal(second.fetchedAt, first.fetchedAt);
    assert.equal(second.feeds[0].consecutiveFailures, 1);
    const stable = await readFile(join(directory, "discovery.json"), "utf8");
    await assert.rejects(produceSnapshotFile({ directory, sourceSha, fetch: async () => { throw Error("fetch aborted"); } }), /fetch aborted/);
    assert.equal(await readFile(join(directory, "discovery.json"), "utf8"), stable);
    let release!: () => void;
    const locked = produceSnapshotFile({ directory, sourceSha, fetch: () => new Promise((resolve) => { release = () => resolve(result); }), now: () => now + 2000 });
    while (!release) await new Promise((resolve) => setTimeout(resolve, 5));
    await assert.rejects(produceSnapshotFile({ directory, sourceSha, fetch: async () => result }), /EEXIST/);
    release(); await locked;
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("native Git snapshot publication is isolated, read back and protected by exact leases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "factdesk-git-"));
  const run = (args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim();
  try {
    const remote = join(directory, "remote.git"); run(["init", "--bare", remote]);
    const a = join(directory, "a"); const b = join(directory, "b");
    run(["clone", remote, a]); run(["clone", remote, b]);
    const first = buildDiscoverySnapshot(result, null, sourceSha, now);
    const sha1 = publishSnapshot(a, first, null);
    assert.equal(readSnapshotHead(b).sha, sha1);
    const second = buildDiscoverySnapshot(result, first, sourceSha, now + 1000);
    const sha2 = publishSnapshot(b, second, sha1);
    assert.notEqual(sha2, sha1);
    assert.equal(run(["--git-dir", remote, "rev-list", "--count", sha2]), "1", "snapshot branch history must remain bounded");
    assert.throws(() => publishSnapshot(a, buildDiscoverySnapshot(result, first, sourceSha, now + 2000), sha1), /changed/);
    assert.throws(() => publishSnapshot(a, first, sha2), /Out-of-order/);
    assert.equal(readSnapshotHead(a).sha, sha2);
    const raceSnapshot = buildDiscoverySnapshot(result, second, sourceSha, now + 2000);
    const race = (repo: string, candidate = raceSnapshot) => promisify(execFile)(process.execPath, ["--import", "tsx", "--input-type=module", "-e", 'import {publishSnapshot} from "./scripts/evaluation-snapshot-store.ts"; publishSnapshot(process.argv[1], JSON.parse(process.argv[2]), process.argv[3]);', repo, JSON.stringify(candidate), sha2], { cwd: process.cwd() });
    const racers = await Promise.allSettled([race(a), race(b, { ...raceSnapshot, sourceSha: "c".repeat(40) })]);
    assert.equal(racers.filter((r) => r.status === "fulfilled").length, 1, "two independent processes cannot both publish from one lease");
    const winning = readSnapshotHead(a);
    assert.equal(winning.snapshot?.attemptedAt, raceSnapshot.attemptedAt);
    assert.notEqual(winning.sha, sha2);
    assert.equal(run(["--git-dir", remote, "for-each-ref", "--format=%(refname)"]), "refs/heads/data/evaluation-live-feed");
    assert.equal(run(["-C", a, "show", `${sha2}:vercel.json`]), '{"git":{"deploymentEnabled":false}}');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("scheduler provenance accepts only the fixed GitHub workflow identity", () => {
  const valid = {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "andrewcrising/the-fact-desk",
    GITHUB_EVENT_NAME: "schedule",
    GITHUB_RUN_ID: "123456789",
    GITHUB_RUN_ATTEMPT: "2",
    GITHUB_WORKFLOW_REF: "andrewcrising/the-fact-desk/.github/workflows/evaluation-ingestion.yml@refs/heads/main",
  };
  assert.deepEqual(githubSnapshotProducer(valid), {
    platform: "github-actions", event: "schedule", repository: "andrewcrising/the-fact-desk",
    runId: "123456789", runAttempt: 2, workflowRef: valid.GITHUB_WORKFLOW_REF,
  });
  assert.equal(githubSnapshotProducer({ ...valid, GITHUB_EVENT_NAME: "push" }), null);
  assert.equal(githubSnapshotProducer({ ...valid, GITHUB_REPOSITORY: "attacker/fork" }), null);
  assert.equal(githubSnapshotProducer({ ...valid, GITHUB_WORKFLOW_REF: "andrewcrising/the-fact-desk/.github/workflows/other.yml@refs/heads/main" }), null);
});

test("CLI refuses publication while automatic-build and ingestion gates are closed", () => {
  assert.throws(() => execFileSync(process.execPath, ["--import", "tsx", "scripts/run-evaluation-ingestion.ts", "--state-dir", "/tmp/factdesk-must-not-publish", "--publish"], { cwd: process.cwd(), encoding: "utf8", stdio: "pipe", env: { ...process.env, FACT_DESK_EVALUATION_INGESTION_ENABLED: "false", FACT_DESK_NONPRODUCTION_BUILDS_DISABLED: "false" } }), (error: unknown) => {
    assert.match(String((error as { stderr?: string }).stderr), /requires explicit ingestion and verified automatic-build isolation gates/);
    return true;
  });
});
