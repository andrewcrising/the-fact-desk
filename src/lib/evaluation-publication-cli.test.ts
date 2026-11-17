import assert from "node:assert/strict";
import test from "node:test";
import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stories } from "@/data/stories";
import { EVALUATION_FEEDS } from "./discovery-feeds";
import { buildDiscoverySnapshot, CATEGORIES } from "./discovery-snapshot";
import { publishSnapshot, readSnapshotHead } from "../../scripts/evaluation-snapshot-store";

const headlines = {
  Politics: "Congress passes election legislation",
  Markets: "Federal Reserve raises interest rates",
  Technology: "Software vulnerability exposes chip flaw",
  World: "Island officials announce maritime border talks",
  Health: "Hospital opens clinical cancer service",
  Courts: "Court sentences defendants in fraud case",
  Energy: "Oil production increases at gas field",
  Culture: "Film festival celebrates a music star",
};

test("native ingestion CLI preserves the accepted snapshot on coverage loss or outage", async (t) => {
  for (const mode of ["missing-energy", "outage", "complete"] as const) {
    await t.test(mode, async () => {
      const directory = await mkdtemp(join(tmpdir(), "factdesk-publication-cli-"));
      const git = (args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: "pipe" }).trim();
      try {
        const repo = join(directory, "source");
        const remote = join(directory, "remote.git");
        git(["clone", "--shared", "--no-hardlinks", process.cwd(), repo]);
        git(["init", "--bare", remote]);
        git(["-C", repo, "remote", "set-url", "origin", remote]);
        // Execute the actual working scripts, including an uncommitted correction.
        for (const file of ["evaluation-snapshot-store.ts", "run-evaluation-ingestion.ts"]) {
          await cp(join(process.cwd(), "scripts", file), join(repo, "scripts", file));
        }
        await cp(join(process.cwd(), "src"), join(repo, "src"), { recursive: true });
        git(["-C", repo, "add", "scripts", "src"]);
        git(["-C", repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--allow-empty", "-m", "Native fixture source"]);
        await symlink(join(process.cwd(), "node_modules"), join(repo, "node_modules"), "dir");
        const sourceSha = git(["-C", repo, "rev-parse", "HEAD"]);
        const now = Date.now() - 60_000;
        const approved = buildDiscoverySnapshot({
          stories: CATEGORIES.map((category, index) => ({
            ...stories[0], id: `approved-${index}`, slug: `approved-${index}`,
            title: headlines[category], category, sources: ["BBC World"],
            sourceUrls: [`https://www.bbc.com/news/articles/approved-${index}`],
            publishedAt: new Date(now - 1000).toISOString(),
          })),
          feeds: EVALUATION_FEEDS.map((feed) => ({ url: feed.url, source: feed.name, category: feed.category, count: 1, status: "ok" })),
        }, null, sourceSha, now);
        const before = publishSnapshot(repo, approved, null);
        const harness = `
          import { EVALUATION_FEEDS } from './src/lib/discovery-feeds.ts';
          const mode = ${JSON.stringify(mode)};
          const headlines = ${JSON.stringify(headlines)};
          globalThis.fetch = async (input) => {
            if (mode === 'outage') throw Error('Fixture feed outage');
            const feed = EVALUATION_FEEDS.find(f => f.url === String(input));
            if (!feed) throw Error('Unexpected network request');
            let category = feed.category;
            if (mode === 'missing-energy' && category === 'Energy') category = 'World';
            if (feed.name === 'BBC Science' && mode === 'complete') category = 'Energy';
            const host = feed.name.startsWith('BBC') ? 'www.bbc.com' :
              feed.name.startsWith('The Guardian') ? 'www.theguardian.com' :
              feed.name === 'NPR' ? 'www.npr.org' :
              feed.name === 'PBS News' ? 'www.pbs.org' :
              feed.name === 'Fox News' ? 'www.foxnews.com' :
              feed.name === 'NASA' ? 'www.nasa.gov' :
              feed.name === 'Federal Reserve' ? 'www.federalreserve.gov' : 'www.justice.gov';
            const path = 'articlePathPrefix' in feed ? feed.articlePathPrefix : '/news/';
            const link = 'https://' + host + path + encodeURIComponent(feed.name + '-' + feed.category);
            const xml = '<rss version="2.0"><channel><item><title>' + headlines[category] + '</title><link>' + link + '</link><description>' + headlines[category] + ' reporting detail.</description><pubDate>' + new Date(Date.now()-1000).toUTCString() + '</pubDate></item></channel></rss>';
            return new Response(xml, {headers: {'content-type': 'application/rss+xml'}});
          };
          process.argv = [process.execPath, 'scripts/run-evaluation-ingestion.ts', '--state-dir', ${JSON.stringify(join(directory, "state"))}, '--publish'];
          await import('./scripts/run-evaluation-ingestion.ts');
        `;
        const run = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", harness], {
          cwd: repo, encoding: "utf8", timeout: 30_000,
          env: { ...process.env, GITHUB_ACTIONS: "false", FACT_DESK_EVALUATION_INGESTION_ENABLED: "true", FACT_DESK_NONPRODUCTION_BUILDS_DISABLED: "true" },
        });
        assert.equal(run.error, undefined, String(run.error));
        const after = readSnapshotHead(repo);
        if (mode === "complete") {
          assert.equal(run.status, 0, run.stderr + run.stdout);
          assert.notEqual(after.sha, before);
          const receipt = run.stdout.split("\n").filter(Boolean).map((line) => {
            try { return JSON.parse(line); } catch { return null; }
          }).find((value) => value?.publishedCommit);
          assert.equal(receipt?.publishedCommit, after.sha);
          const publishedBytes = execFileSync("git", ["-C", repo, "show", `${after.sha}:discovery.json`]);
          assert.equal(receipt.snapshotSha256, createHash("sha256").update(publishedBytes).digest("hex"));
          assert.equal(receipt.sourceSha, sourceSha);
          assert.equal(receipt.producer, null, "a manual fixture run must not claim to be a scheduled run");
        } else {
          assert.equal(run.status, 2, run.stderr + run.stdout);
          assert.equal(after.sha, before, "a rejected ingestion must not replace the accepted remote snapshot");
          assert.equal(after.snapshot?.fetchedAt, approved.fetchedAt);
        }
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  }
});
