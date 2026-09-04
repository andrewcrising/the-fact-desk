import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "@/app/api/stories/[id]/draft-assist/route";
import type { NextRequest } from "next/server";

function request(token?: string) {
  return new Request("https://example.com/api/stories/story-1/draft-assist", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  }) as NextRequest;
}

const ctx = { params: Promise.resolve({ id: "story-1" }) };

describe("AI Draft Assist route", () => {
  it("rejects missing admin token", async () => {
    process.env.ADMIN_API_TOKEN = "admin-test";
    const response = await POST(request(), ctx);
    assert.equal(response.status, 401);
  });

  it("returns unavailable when AI Draft Assist is disabled", async () => {
    process.env.ADMIN_API_TOKEN = "admin-test";
    process.env.AI_DRAFT_ASSIST_ENABLED = "false";
    process.env.OPENAI_API_KEY = "";

    const response = await POST(request("admin-test"), ctx);
    const payload = await response.json();

    assert.equal(response.status, 503);
    assert.equal(payload.ok, false);
    assert.match(payload.error, /not configured/);
  });
});
