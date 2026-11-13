import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { buildDiscoverySnapshot, parseDiscoverySnapshot, SNAPSHOT_MAX_BYTES, type DiscoverySnapshot, type FeedAttempt } from "../src/lib/discovery-snapshot";
import type { Story } from "../src/types/story";

export const SNAPSHOT_BRANCH = "data/evaluation-live-feed";
const ref = `refs/heads/${SNAPSHOT_BRANCH}`;
function git(repo: string, args: string[], input?: string): string {
  return execFileSync("git", ["-C", repo, ...args], { input, encoding: "utf8", timeout: 30_000, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, GIT_AUTHOR_NAME: "Fact Desk evaluation ingestion", GIT_AUTHOR_EMAIL: "evaluation@thefactdesk.invalid", GIT_COMMITTER_NAME: "Fact Desk evaluation ingestion", GIT_COMMITTER_EMAIL: "evaluation@thefactdesk.invalid" } }).trim();
}
export function readSnapshotHead(repo: string): { sha: string | null; snapshot: DiscoverySnapshot | null } {
  let advertisement: string;
  try { advertisement = git(repo, ["ls-remote", "--exit-code", "origin", ref]); }
  catch (error) {
    if ((error as { status?: number }).status === 2) return { sha: null, snapshot: null };
    throw Error("Cannot authenticate evaluation snapshot ref; refusing blind publication");
  }
  const sha = advertisement.split(/\s+/)[0];
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Error("Invalid evaluation ref");
  git(repo, ["fetch", "--no-tags", "origin", sha]);
  const raw = git(repo, ["show", `${sha}:discovery.json`]);
  if (Buffer.byteLength(raw) > SNAPSHOT_MAX_BYTES) throw Error("Stored snapshot exceeds bound");
  const snapshot = parseDiscoverySnapshot(JSON.parse(raw));
  if (!snapshot) throw Error("Invalid stored snapshot; operator recovery required");
  return { sha, snapshot };
}

/** Must be called only after build-trigger isolation is independently verified. */
export function publishSnapshot(repo: string, snapshot: DiscoverySnapshot, expectedSha: string | null): string {
  const parsed = parseDiscoverySnapshot(snapshot);
  if (!parsed) throw Error("Invalid publication snapshot");
  const current = readSnapshotHead(repo);
  if (current.sha !== expectedSha) throw Error("Evaluation snapshot changed; refresh and retry without overwriting");
  if (current.snapshot && Date.parse(parsed.attemptedAt) <= Date.parse(current.snapshot.attemptedAt)) throw Error("Out-of-order snapshot publication");
  const raw = JSON.stringify(parsed);
  if (Buffer.byteLength(raw) > SNAPSHOT_MAX_BYTES) throw Error("Publication exceeds snapshot bound");
  const blob = git(repo, ["hash-object", "-w", "--stdin"], raw);
  const config = git(repo, ["hash-object", "-w", "--stdin"], '{"git":{"deploymentEnabled":false}}\n');
  const tree = git(repo, ["mktree"], `100644 blob ${blob}\tdiscovery.json\n100644 blob ${config}\tvercel.json\n`);
  const sha = git(repo, ["commit-tree", tree, ...(expectedSha ? ["-p", expectedSha] : [])], `[skip ci] Evaluation feed snapshot ${parsed.attemptedAt}\n`);
  // Explicit branch and exact lease: never write main, app code or another producer's result.
  git(repo, ["push", `--force-with-lease=${ref}:${expectedSha ?? ""}`, "origin", `${sha}:${ref}`]);
  const readback = readSnapshotHead(repo);
  if (readback.sha !== sha) throw Error("Published snapshot readback failed");
  return sha;
}

export async function produceSnapshotFile(options: {
  directory: string;
  sourceSha: string;
  previous?: DiscoverySnapshot | null;
  fetch: () => Promise<{ stories: Story[]; feeds: FeedAttempt[] }>;
  now?: () => number;
}): Promise<DiscoverySnapshot> {
  await mkdir(options.directory, { recursive: true });
  const lock = join(options.directory, ".ingestion-lock");
  await mkdir(lock); // Atomic exclusion across independent processes; never steal a lock.
  const temporary = join(options.directory, `.discovery-${process.pid}.tmp`);
  try {
    let previous = options.previous ?? null;
    try {
      const raw = await readFile(join(options.directory, "discovery.json"), "utf8");
      if (Buffer.byteLength(raw) > SNAPSHOT_MAX_BYTES) throw Error("Local snapshot too large");
      const parsed = parseDiscoverySnapshot(JSON.parse(raw), (options.now ?? Date.now)());
      if (!parsed) throw Error("Invalid local snapshot");
      if (!previous || Date.parse(parsed.attemptedAt) > Date.parse(previous.attemptedAt)) previous = parsed;
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const result = await options.fetch();
    const snapshot = buildDiscoverySnapshot(result, previous, options.sourceSha, (options.now ?? Date.now)());
    const raw = JSON.stringify(snapshot);
    if (Buffer.byteLength(raw) > SNAPSHOT_MAX_BYTES) throw Error("Snapshot too large");
    await writeFile(temporary, raw, { flag: "wx", mode: 0o600 });
    await rename(temporary, join(options.directory, "discovery.json"));
    return snapshot;
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
