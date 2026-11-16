import { requireAdminOrCronRequest } from "@/lib/auth";
import { AUTOMATION_ALREADY_RUNNING_MESSAGE } from "@/lib/automation/automation-repository";
import { runBriefingPipeline } from "@/lib/automation/briefing-pipeline";
import { getAutomationMode } from "@/lib/automation/config";
import { shouldDryRunPipelineRequest } from "@/lib/automation/pipeline-request";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const message =
      error instanceof Error ? error.message : "Unable to run briefing pipeline";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === AUTOMATION_ALREADY_RUNNING_MESSAGE ? 409 : 500 },
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
