/**
 * Local JSON cache for ingested live RSS stories (dev / preview).
 * Production: replace with Supabase, Vercel Blob, or KV — not serverless FS.
 */
import type { Story } from "@/types/story";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export const LIVE_STORIES_RELATIVE_PATH = "data/live-stories.json";

export interface LiveStoriesCacheFile {
  generatedAt: string | null;
  feedCount: number;
  stories: Story[];
}

const EMPTY: LiveStoriesCacheFile = {
  generatedAt: null,
  feedCount: 0,
  stories: [],
};

export function getLiveStoriesFilePath(): string {
  return join(process.cwd(), LIVE_STORIES_RELATIVE_PATH);
}

export function readLiveStoriesCache(): LiveStoriesCacheFile {
  const filePath = getLiveStoriesFilePath();
  if (!existsSync(filePath)) {
    return { ...EMPTY };
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as LiveStoriesCacheFile;
    if (!Array.isArray(parsed.stories)) {
      return { ...EMPTY };
    }
    return {
      generatedAt: parsed.generatedAt ?? null,
      feedCount: parsed.feedCount ?? 0,
      stories: parsed.stories,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeLiveStoriesCache(payload: LiveStoriesCacheFile): void {
  const filePath = getLiveStoriesFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
}
