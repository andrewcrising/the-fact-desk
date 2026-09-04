import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  POST,
  shouldDryRunPipelineRequest,
} from "@/app/api/automation/run-briefing-pipeline/route";
import type { NextRequest } from "next/server";

function request(token?: string, url = "https://example.com/api/automation/run-briefing-pipeline") {
  return new Request(url, {
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

  it("forces GET requests to be dry-run even when no query flag is present", () => {
    const req = new Request(
      "https://example.com/api/automation/run-briefing-pipeline",
    ) as NextRequest;
    assert.equal(shouldDryRunPipelineRequest(req, "GET"), true);
  });

  it("allows writes only through an explicit POST without dry-run", () => {
    const live = new Request(
      "https://example.com/api/automation/run-briefing-pipeline",
    ) as NextRequest;
    const queryDryRun = new Request(
      "https://example.com/api/automation/run-briefing-pipeline?dry_run=true",
    ) as NextRequest;

    assert.equal(shouldDryRunPipelineRequest(live, "POST", {}), false);
    assert.equal(shouldDryRunPipelineRequest(queryDryRun, "POST", {}), true);
    assert.equal(
      shouldDryRunPipelineRequest(live, "POST", { dry_run: true }),
      true,
    );
  });
});
