import { requireAdminRequest } from "@/lib/auth";
import { getEvidenceAssistForStory } from "@/lib/evidence-assist-repository";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Editorial assist only. This route calculates source/evidence posture and
 * never mutates story fields or publishes content.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const profile = await getEvidenceAssistForStory(id);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate evidence assist",
      },
      { status: 400 },
    );
  }
}
