import { runBriefingPipeline } from "@/lib/automation/briefing-pipeline";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Temporary recovery smoke-test endpoint.
 *
 * This route is intentionally restricted to Vercel Preview deployments and
 * forces auto_draft mode so it can exercise the full RSS -> Supabase -> draft
 * path without publishing anything. The route should be removed after the
 * recovery smoke test succeeds.
 */
export async function GET() {
  if (
    process.env.VERCEL_ENV !== "preview" ||
    process.env.VERCEL_GIT_COMMIT_REF !== "chatgpt/fact-desk-recovery"
  ) {
    return NextResponse.json({ ok: false, error: "Not available" }, { status: 404 });
  }

  const report = await runBriefingPipeline({
    dryRun: false,
    mode: "auto_draft",
  });

  return NextResponse.json({ ok: report.errors.length === 0, report });
}
