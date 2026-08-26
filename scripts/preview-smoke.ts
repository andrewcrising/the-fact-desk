import { runBriefingPipeline } from "../src/lib/automation/briefing-pipeline";

async function main() {
  const isRecoveryPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "chatgpt/fact-desk-recovery";

  if (!isRecoveryPreview) {
    console.log("[fact-desk-smoke] skipped outside recovery preview");
    return;
  }

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ADMIN_API_TOKEN: Boolean(process.env.ADMIN_API_TOKEN),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    FACT_DESK_AUTOMATION_MODE: process.env.FACT_DESK_AUTOMATION_MODE ?? null,
  };

  console.log("[fact-desk-smoke] env", JSON.stringify(envStatus));

  const hasSupabaseUrl = envStatus.NEXT_PUBLIC_SUPABASE_URL;
  const hasServerKey =
    envStatus.SUPABASE_SECRET_KEY || envStatus.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasSupabaseUrl || !hasServerKey) {
    console.log(
      "[fact-desk-smoke] skipped pipeline because Supabase Preview credentials are missing",
    );
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
