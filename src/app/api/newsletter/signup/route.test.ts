import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "@/app/api/newsletter/signup/route";
import type { NextRequest } from "next/server";

function jsonRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/newsletter/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("newsletter signup route", () => {
  it("rejects invalid email addresses", async () => {
    const response = await POST(jsonRequest({ email: "not-an-email" }));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.ok, false);
  });

  it("silently accepts honeypot spam submissions without storing PII", async () => {
    const response = await POST(
      jsonRequest({ email: "bot@example.com", company: "spam" }),
    );
    const payload = await response.json();

    assert.equal(response.status, 202);
    assert.deepEqual(payload, { ok: true });
  });
});
