import { requireAdminRequest } from "@/lib/auth";
import {
  generateEditorialDraftAssist,
  getDraftAssistContextForStory,
} from "@/lib/ai/editorial-draft-assist";
import { isAiDraftAssistConfigured } from "@/lib/ai/provider";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Human-reviewed AI Draft Assist.
 *
 * Admin-only, suggestion-only, and read-only: this route never mutates story
 * fields and never publishes content.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  if (!isAiDraftAssistConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AI Draft Assist is not configured. Set AI_DRAFT_ASSIST_ENABLED=true and OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const { id } = await params;
    const context = await getDraftAssistContextForStory(id);
    const suggestions = await generateEditorialDraftAssist(context);

    return NextResponse.json({
      ok: true,
      suggestions,
      context: {
        evidence_assist: context.evidence_assist,
        source_count: context.attached_sources.length,
        feed_item_count: context.related_feed_items.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate AI Draft Assist suggestions.",
      },
      { status: 400 },
    );
  }
}
