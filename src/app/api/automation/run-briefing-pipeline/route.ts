import { requireAdminOrCronRequest } from "@/lib/auth";
import { runBriefingPipeline } from "@/lib/automation/briefing-pipeline";
import { getAutomationMode } from "@/lib/automation/config";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function dryRunFromRequest(request: Request): boolean {
  return new URL(request.url).searchParams.get("dry_run") === "true";
}

export function shouldDryRunPipelineRequest(
  request: Request,
  method: "GET" | "POST",
  body?: { dry_run?: boolean; dryRun?: boolean },
): boolean {
  // GET is intentionally read-only. This prevents crawlers, link prefetchers,
  // health checks, or accidental browser navigation from mutating Supabase.
  if (method === "GET") return true;

  return body?.dry_run === true || body?.dryRun === true || dryRunFromRequest(request);
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = shouldDryRunPipelineRequest(request, "POST", body);
    const report = await runBriefingPipeline({
      dryRun,
      mode: getAutomationMode(),
    });
    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to run briefing pipeline",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  const report = await runBriefingPipeline({
    dryRun: shouldDryRunPipelineRequest(request, "GET"),
    mode: getAutomationMode(),
  });
  return NextResponse.json({ ok: true, report });
}
