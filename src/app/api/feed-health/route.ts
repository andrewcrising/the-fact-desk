import { getScheduledSnapshot } from "@/lib/scheduled-discovery";
import { summarizeFeedHealth } from "@/lib/discovery-snapshot";

export const dynamic = "force-dynamic";
/** Read-only; never fetches RSS, writes storage, or claims a scheduler run. */
export async function GET() {
  const health = summarizeFeedHealth(await getScheduledSnapshot());
  return Response.json(health, { status: health.status === "unavailable" || health.status === "stale" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
