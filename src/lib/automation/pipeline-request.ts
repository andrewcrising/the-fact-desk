export function dryRunFromRequest(request: Request): boolean {
  return new URL(request.url).searchParams.get("dry_run") === "true";
}

export function shouldDryRunPipelineRequest(
  request: Request,
  method: "GET" | "POST",
  body?: { dry_run?: boolean; dryRun?: boolean },
): boolean {
  // GET is intentionally read-only. This prevents crawlers, link prefetchers,
  // health checks, or accidental browser navigation from mutating Supabase.
  if (method === "GET") return true;

  return body?.dry_run === true || body?.dryRun === true || dryRunFromRequest(request);
}
