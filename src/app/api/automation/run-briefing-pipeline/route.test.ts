import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "@/app/api/automation/run-briefing-pipeline/route";
import type { NextRequest } from "next/server";

function request(token?: string) {
  return new Request("https://example.com/api/automation/run-briefing-pipeline", {
    method: "POST",
    headers: token
      ? {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        }
      : { "content-type": "application/json" },
    body: JSON.stringify({ dry_run: true }),
  }) as NextRequest;
}

describe("automation pipeline route", () => {
  it("rejects missing admin or cron token", async () => {
    process.env.ADMIN_API_TOKEN = "admin";
    process.env.CRON_SECRET = "cron";
    const response = await POST(request());
    assert.equal(response.status, 401);
  });
});
