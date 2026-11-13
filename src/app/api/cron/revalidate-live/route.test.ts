import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route";

test("unauthenticated and isolated-preview refresh requests cannot fetch or invalidate feeds", async () => {
  const prior = process.env.FACT_DESK_PREVIEW_ISOLATED;
  const token = process.env.ADMIN_API_TOKEN;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => { requests++; throw Error("must not fetch"); };
  try {
    process.env.ADMIN_API_TOKEN = "test-token";
    assert.equal((await GET(new Request("https://example.test/api/cron/revalidate-live"))).status, 401);
    process.env.FACT_DESK_PREVIEW_ISOLATED = "true";
    assert.equal((await GET(new Request("https://example.test/api/cron/revalidate-live", { headers: { authorization: "Bearer test-token" } }))).status, 401);
    assert.equal(requests, 0);
  } finally {
    if (prior === undefined) delete process.env.FACT_DESK_PREVIEW_ISOLATED; else process.env.FACT_DESK_PREVIEW_ISOLATED = prior;
    if (token === undefined) delete process.env.ADMIN_API_TOKEN; else process.env.ADMIN_API_TOKEN = token;
    globalThis.fetch = originalFetch;
  }
});
