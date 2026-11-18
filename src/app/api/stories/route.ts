import { requireAdminRequest } from "@/lib/auth";
import { parseStoryInput } from "@/lib/story-input";
import { createStory, listStories } from "@/lib/story-repository";
import type { Signal, StoryCategory } from "@/types/story";
import type { StoryStatus } from "@/types/editorial";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as StoryStatus | "all" | null;

  if (status && status !== "published") {
    const unauthorized = requireAdminRequest(request);
    if (unauthorized) return unauthorized;
  }

  try {
    const stories = await listStories({
      status: status ?? "published",
      category: (searchParams.get("category") as StoryCategory | null) ?? undefined,
      signal: (searchParams.get("signal") as Signal | null) ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json({ ok: true, count: stories.length, stories });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to list stories",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const input = parseStoryInput(await request.json());
    const story = await createStory({ ...input, status: "draft" });
    return NextResponse.json({ ok: true, story }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to create story",
      },
      { status: 400 },
    );
  }
}
