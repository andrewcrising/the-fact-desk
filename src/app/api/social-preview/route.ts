import { ingestSocialSignalsWithDiagnostics } from "@/lib/ingest/social-signal";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/social-preview
 *
 * Safe validation surface for the opt-in social lane. This endpoint exposes
 * ranked, attributed public signals without treating them as confirmed news.
 */
export async function GET() {
  try {
    const result = await ingestSocialSignalsWithDiagnostics();
    return NextResponse.json({
      ok: true,
      enabled: result.sourcesChecked > 0,
      generatedAt: result.fetchedAt,
      sourcesChecked: result.sourcesChecked,
      sourcesWithSignals: result.sourcesWithSignals,
      failedSourceIds: result.failedSourceIds,
      providerCounts: result.providerCounts,
      count: result.signals.length,
      signals: result.signals.slice(0, 24),
      evidenceNote:
        "Social ranking reflects discovery value, recency, and engagement. It is not a truth score and does not independently confirm factual claims.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message, count: 0, signals: [] },
      { status: 500 },
    );
  }
}
