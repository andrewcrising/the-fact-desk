import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchDiscoveryWithDiagnostics } from "../src/lib/discovery";
import { summarizeFeedHealth } from "../src/lib/discovery-snapshot";
import { githubSnapshotProducer, produceSnapshotFile, publishSnapshot, readSnapshotHead, snapshotPublicationIssues } from "./evaluation-snapshot-store";

const publish = process.argv.includes("--publish");
const directoryIndex = process.argv.indexOf("--state-dir");
if (directoryIndex < 0 || !process.argv[directoryIndex + 1] || process.argv[directoryIndex + 1].startsWith("--")) throw Error("Provide --state-dir outside the source tree");
const repo = process.cwd();
const directory = resolve(process.argv[directoryIndex + 1]);
if (directory === repo || directory.startsWith(`${repo}/`)) throw Error("State must remain outside the source tree");
if (publish && (process.env.FACT_DESK_EVALUATION_INGESTION_ENABLED !== "true" || process.env.FACT_DESK_NONPRODUCTION_BUILDS_DISABLED !== "true")) throw Error("Publication requires explicit ingestion and verified automatic-build isolation gates");
if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) throw Error("Commit reviewed source before ingestion; refuse misleading source provenance");
const sourceSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const previous = publish ? readSnapshotHead(repo) : { sha: null, snapshot: null };
const producer = githubSnapshotProducer();
if (process.env.GITHUB_ACTIONS === "true" && !producer) throw Error("GitHub ingestion provenance is incomplete or does not match the fixed workflow");
const snapshot = await produceSnapshotFile({ directory, sourceSha, previous: previous.snapshot, fetch: fetchDiscoveryWithDiagnostics, producer });
const publicationIssues = snapshotPublicationIssues(snapshot);
if (publish && !publicationIssues.length) {
  const publishedCommit = publishSnapshot(repo, snapshot, previous.sha);
  const publishedBytes = execFileSync("git", ["show", `${publishedCommit}:discovery.json`]);
  console.log(JSON.stringify({ publishedCommit, snapshotSha256: createHash("sha256").update(publishedBytes).digest("hex"), sourceSha, producer }));
} else if (publish) {
  console.error(`Snapshot publication rejected: ${publicationIssues.join("; ")}`);
}
const health = summarizeFeedHealth(snapshot);
console.log(JSON.stringify(health, null, 2));
const failed = snapshot.feeds.filter((f) => f.status !== "ok").length;
if (process.env.GITHUB_ACTIONS === "true" && failed) console.warn(`::warning::${failed} evaluation feeds supplied no eligible content; inspect /api/feed-health`);
const missingCategories = Object.entries(health.categories).filter(([, count]) => count === 0).map(([category]) => category);
if (process.env.GITHUB_ACTIONS === "true" && missingCategories.length) console.warn(`::warning::Missing current coverage for categories: ${missingCategories.join(", ")}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const categoryRows = Object.entries(health.categories).map(([category, count]) => `| ${category} | ${count} |`).join("\n");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Fact Desk evaluation ingestion\n\n- Status: **${health.status}**\n- Current source reports: **${health.stories}**\n- Healthy feeds: **${snapshot.feeds.length - failed}/${snapshot.feeds.length}**\n- Trigger: **${producer?.event ?? "unattested"}**\n\n| Category | Reports |\n| --- | ---: |\n${categoryRows}\n`);
}
if (publicationIssues.length) process.exitCode = 2;
