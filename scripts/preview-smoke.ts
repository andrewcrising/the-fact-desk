import { runBriefingPipeline } from "../src/lib/automation/briefing-pipeline";

async function main() {
  const isRecoveryPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "chatgpt/fact-desk-recovery";

  if (!isRecoveryPreview) {
    console.log("[fact-desk-smoke] skipped outside recovery preview");
    return;
  }

  console.log("[fact-desk-smoke] starting recovery preview pipeline in auto_draft mode");

  const report = await runBriefingPipeline({
    dryRun: false,
    mode: "auto_draft",
  });

  console.log(
    "[fact-desk-smoke] report",
    JSON.stringify({
      mode: report.mode,
      feeds_checked: report.feeds_checked,
      feed_items_seen: report.feed_items_seen,
      new_feed_items: report.new_feed_items,
      duplicates_skipped: report.duplicates_skipped,
      clusters_created: report.clusters_created,
      drafts_created: report.drafts_created,
      drafts_updated: report.drafts_updated,
      stories_auto_published: report.stories_auto_published,
      stories_needing_review: report.stories_needing_review,
      errors: report.errors,
      warnings: report.warnings,
    }),
  );
}

main().catch((error) => {
  console.error(
    "[fact-desk-smoke] fatal",
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
