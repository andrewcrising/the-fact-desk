import { NextResponse } from "next/server";

export function hasBearerToken(request: Request, expected?: string): boolean {
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export function isAdminRequest(request: Request): boolean {
  return hasBearerToken(request, process.env.ADMIN_API_TOKEN);
}

export function isCronRequest(request: Request): boolean {
  return hasBearerToken(request, process.env.CRON_SECRET);
}

export function requireAdminRequest(request: Request): NextResponse | null {
  if (isAdminRequest(request)) return null;
  return NextResponse.json(
    { ok: false, error: "Unauthorized. Provide Authorization: Bearer ADMIN_API_TOKEN." },
    { status: 401 },
  );
}

export function requireAdminOrCronRequest(request: Request): NextResponse | null {
  if (isAdminRequest(request) || isCronRequest(request)) return null;
  return NextResponse.json(
    {
      ok: false,
      error:
        "Unauthorized. Provide Authorization: Bearer ADMIN_API_TOKEN or CRON_SECRET.",
    },
    { status: 401 },
  );
}
