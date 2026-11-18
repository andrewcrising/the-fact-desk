import { requireAdminOrCronRequest } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron: refresh live RSS cache (unstable_cache tag).
 * Set CRON_SECRET in Vercel env; cron sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  revalidateTag("live-rss", { expire: 0 });

  return NextResponse.json({
    ok: true,
    revalidated: true,
    tag: "live-rss",
    at: new Date().toISOString(),
  });
}
