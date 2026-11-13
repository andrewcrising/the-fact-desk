import { requireAdminOrCronRequest } from "@/lib/auth";
import { getBoundedDiscovery } from "@/lib/discovery";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Authenticated refresh of the current Worker's real homepage discovery cache.
 * Set CRON_SECRET in Vercel env; cron sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const unauthorized = requireAdminOrCronRequest(request);
  if (unauthorized) return unauthorized;

  getBoundedDiscovery.invalidate();
  const result = await getBoundedDiscovery();
  const refreshed = result.source === "live" && result.stories.length > 0;

  return NextResponse.json({
    ok: refreshed,
    refreshed,
    source: result.source,
    availableStories: result.stories.length,
    fetchedAt: result.fetchedAt,
    scope: "current-worker",
    at: new Date().toISOString(),
  }, { status: refreshed ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
