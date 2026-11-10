import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PUT } from "@/app/api/stories/[id]/sources/[sourceId]/review/route";
import type { NextRequest } from "next/server";

const context = { params: Promise.resolve({ id: "story-id", sourceId: "source-id" }) };
function request(body: unknown, token?: string) {
  return new Request("https://example.com/api/stories/story-id/sources/source-id/review", {
    method: "PUT",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }) as NextRequest;
}
describe("review authorization fail-closed", () => {
  it("rejects unauthenticated review before touching the database", async () => {
    const prior = process.env.ADMIN_API_TOKEN;
    try {
      process.env.ADMIN_API_TOKEN = "review-admin-token";
      const response = await PUT(request({ originId: "forged", expectedUrl: "https://example.org/a" }), context);
      assert.equal(response.status, 401);
    } finally {
      if (prior === undefined) delete process.env.ADMIN_API_TOKEN;
      else process.env.ADMIN_API_TOKEN = prior;
    }
  });
  it("rejects cron credentials and does not authorize them as reviewers", async () => {
    const priorAdmin = process.env.ADMIN_API_TOKEN;
    const priorCron = process.env.CRON_SECRET;
    try {
      process.env.ADMIN_API_TOKEN = "review-admin-token";
      process.env.CRON_SECRET = "cron-token";
      const response = await PUT(request({ originId: "forged", expectedUrl: "https://example.org/a" }, "cron-token"), context);
      assert.equal(response.status, 401);
    } finally {
      if (priorAdmin === undefined) delete process.env.ADMIN_API_TOKEN;
      else process.env.ADMIN_API_TOKEN = priorAdmin;
      if (priorCron === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = priorCron;
    }
  });
  it("refuses to review without a configured server-side reviewer identity", async () => {
    const priorAdmin = process.env.ADMIN_API_TOKEN;
    const priorReviewer = process.env.PROVENANCE_REVIEWER_ID;
    try {
      process.env.ADMIN_API_TOKEN = "review-admin-token";
      delete process.env.PROVENANCE_REVIEWER_ID;
      const response = await PUT(request({ originId: "forged", expectedUrl: "https://example.org/a" }, "review-admin-token"), context);
      assert.equal(response.status, 503);
    } finally {
      if (priorAdmin === undefined) delete process.env.ADMIN_API_TOKEN;
      else process.env.ADMIN_API_TOKEN = priorAdmin;
      if (priorReviewer === undefined) delete process.env.PROVENANCE_REVIEWER_ID;
      else process.env.PROVENANCE_REVIEWER_ID = priorReviewer;
    }
  });
});
