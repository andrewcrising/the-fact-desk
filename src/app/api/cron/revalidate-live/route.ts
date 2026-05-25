import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron: refresh live RSS cache (unstable_cache tag).
 * Set CRON_SECRET in Vercel env; cron sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  revalidateTag("live-rss", { expire: 0 });

  return NextResponse.json({
    ok: true,
    revalidated: true,
    tag: "live-rss",
    at: new Date().toISOString(),
  });
}
