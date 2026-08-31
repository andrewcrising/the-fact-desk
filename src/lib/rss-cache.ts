/**
 * Local JSON cache for dev RSS ingestion.
 * Later: replace file writes with Supabase upsert or blob storage from cron.
 */
import type { Story } from "@/types/story";
import { sanitizeLiveStoryForDisplay } from "@/lib/ingest/editorial-firewall";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export const RSS_CACHE_RELATIVE_PATH = "data/rss-cache.json";

export interface RssCacheFile {
  cachedAt: string | null;
  feedUrl: string | null;
  stories: Story[];
}

const EMPTY_CACHE: RssCacheFile = {
  cachedAt: null,
  feedUrl: null,
  stories: [],
};

export function getRssCacheFilePath(): string {
  return join(process.cwd(), RSS_CACHE_RELATIVE_PATH);
}

export function readRssCache(): RssCacheFile {
  const filePath = getRssCacheFilePath();
  if (!existsSync(filePath)) {
    return { ...EMPTY_CACHE };
  }

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as RssCacheFile;
    if (!Array.isArray(parsed.stories)) {
      return { ...EMPTY_CACHE };
    }
    return {
      cachedAt: parsed.cachedAt ?? null,
      feedUrl: parsed.feedUrl ?? null,
      stories: parsed.stories.map(sanitizeLiveStoryForDisplay),
    };
  } catch {
    return { ...EMPTY_CACHE };
  }
}

export function writeRssCache(payload: RssCacheFile): void {
  const filePath = getRssCacheFilePath();
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
}
