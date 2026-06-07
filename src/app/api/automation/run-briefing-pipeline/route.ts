import { requireAdminOrCronRequest } from "@/lib/auth";
import { runBriefingPipeline } from "@/lib/automation/briefing-pipeline";
import { getAutomationMode } from "@/lib/automation/config";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function dryRunFromRequest(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get("dry_run") === "true";
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun =
      body?.dry_run === true ||
      body?.dryRun === true ||
      dryRunFromRequest(request);
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
    dryRun: dryRunFromRequest(request),
    mode: getAutomationMode(),
  });
  return NextResponse.json({ ok: true, report });
}
