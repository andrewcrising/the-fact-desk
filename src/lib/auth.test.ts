import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAdminRequest, isCronRequest, requireAdminRequest } from "@/lib/auth";

describe("admin and cron auth guards", () => {
  it("rejects missing or invalid admin bearer token", () => {
    process.env.ADMIN_API_TOKEN = "secret-admin";

    const missing = new Request("https://example.com/api/stories");
    const invalid = new Request("https://example.com/api/stories", {
      headers: { authorization: "Bearer wrong" },
    });

    assert.equal(isAdminRequest(missing), false);
    assert.equal(isAdminRequest(invalid), false);
    assert.equal(requireAdminRequest(missing)?.status, 401);
  });

  it("accepts admin and cron bearer tokens only when configured", () => {
    process.env.ADMIN_API_TOKEN = "secret-admin";
    process.env.CRON_SECRET = "secret-cron";

    const admin = new Request("https://example.com/api/stories", {
      headers: { authorization: "Bearer secret-admin" },
    });
    const cron = new Request("https://example.com/api/ingest/rss", {
      headers: { authorization: "Bearer secret-cron" },
    });

    assert.equal(isAdminRequest(admin), true);
    assert.equal(isCronRequest(cron), true);
  });
});
