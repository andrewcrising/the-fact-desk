import { requireAdminRequest } from "@/lib/auth";
import { requireSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
interface Context { params: Promise<{ id: string; sourceId: string }> }

/** Editorial review only. Never accept review metadata from RSS or public story input. */
export async function PUT(request: NextRequest, { params }: Context) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;
  const reviewer = process.env.PROVENANCE_REVIEWER_ID?.trim();
  if (!reviewer) return NextResponse.json({ ok: false, error: "Reviewer identity not configured" }, { status: 503 });
  try {
    const { id, sourceId } = await params;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid review");
    const origin = (body as Record<string, unknown>).originId;
    if (typeof origin !== "string" || !origin.trim() || origin.trim().length > 256) throw new Error("Invalid origin");
    const db = requireSupabaseAdmin();
    const { data: source, error: sourceError } = await db.from("story_sources")
      .select("id,url").eq("id", sourceId).eq("story_id", id).maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) return NextResponse.json({ ok: false, error: "Source not found" }, { status: 404 });
    const parsed = new URL(source.url);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error("Source URL is not reviewable");
    }
    const expectedUrl = (body as Record<string, unknown>).expectedUrl;
    if (typeof expectedUrl !== "string" || expectedUrl !== source.url) {
      return NextResponse.json({ ok: false, error: "Stale source review" }, { status: 409 });
    }
    const { data: accepted, error } = await db.rpc("attest_story_source_origin", {
      p_story_id: id, p_source_id: sourceId, p_expected_url: expectedUrl,
      p_origin_id: origin.trim(), p_reviewer_id: reviewer,
    });
    if (error) throw error;
    if (accepted !== true) return NextResponse.json({ ok: false, error: "Stale source review" }, { status: 409 });
    return NextResponse.json({ ok: true, sourceId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Review failed" }, { status: 400 });
  }
}
