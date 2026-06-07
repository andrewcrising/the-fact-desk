import { isAdminRequest, requireAdminRequest } from "@/lib/auth";
import { parseStoryUpdateInput } from "@/lib/story-input";
import { getStoryById, getStoryBySlug, updateStory } from "@/lib/story-repository";
import type { PersistedStory } from "@/types/editorial";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let story: PersistedStory | undefined | null = null;

  try {
    story = isAdminRequest(_request)
      ? (await getStoryById(id)) ?? (await getStoryBySlug(id))
      : await getStoryBySlug(id);
  } catch {
    story = await getStoryBySlug(id);
  }

  if (!story) {
    return NextResponse.json(
      { ok: false, error: "Story not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, story });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const input = parseStoryUpdateInput(await request.json());
    const story = await updateStory(id, input);
    return NextResponse.json({ ok: true, story });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update story",
      },
      { status: 400 },
    );
  }
}
