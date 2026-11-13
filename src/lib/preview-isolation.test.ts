import assert from "node:assert/strict";
import test from "node:test";
import { isAdminRequest, isCronRequest } from "./auth";
import { getHomepageStories } from "./story-repository";
import { getSupabaseAdmin, resetSupabaseAdminForTests } from "./supabase";
import { isReadOnlyEvaluation } from "./evaluation-mode";

test("isolated reader disables inherited database credentials, editorial writes and mock fallback", async () => {
  const keys = ["FACT_DESK_PREVIEW_ISOLATED", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_API_TOKEN", "CRON_SECRET", "ALLOW_MOCK_FALLBACK"];
  const prior = keys.map((key) => process.env[key]);
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-dummy-key";
    process.env.ADMIN_API_TOKEN = "test-admin";
    process.env.CRON_SECRET = "test-cron";
    process.env.ALLOW_MOCK_FALLBACK = "true";
    resetSupabaseAdminForTests();
    assert.ok(getSupabaseAdmin(), "simulate a previously cached privileged client");
    process.env.FACT_DESK_PREVIEW_ISOLATED = "true";
    assert.equal(getSupabaseAdmin(), null);
    assert.equal(isAdminRequest(new Request("https://example.test", { headers: { authorization: "Bearer test-admin" } })), false);
    assert.equal(isCronRequest(new Request("https://example.test", { headers: { authorization: "Bearer test-cron" } })), false);
    assert.deepEqual(await getHomepageStories(), []);
  } finally {
    keys.forEach((key, index) => { if (prior[index] === undefined) delete process.env[key]; else process.env[key] = prior[index]; });
    resetSupabaseAdminForTests();
  }
});

test("Vercel Preview automatically disables privileged clients, tokens and fabricated fallback", async () => {
  const previous = process.env.VERCEL_ENV;
  const marker = process.env.FACT_DESK_PREVIEW_ISOLATED;
  const token = process.env.ADMIN_API_TOKEN;
  try {
    delete process.env.FACT_DESK_PREVIEW_ISOLATED;
    process.env.VERCEL_ENV = "preview";
    process.env.ADMIN_API_TOKEN = "test-vercel-preview";
    assert.equal(isReadOnlyEvaluation(), true);
    assert.equal(getSupabaseAdmin(), null);
    assert.equal(isAdminRequest(new Request("https://example.test", { headers: { authorization: "Bearer test-vercel-preview" } })), false);
    assert.deepEqual(await getHomepageStories(), []);
    process.env.VERCEL_ENV = "production";
    assert.equal(isReadOnlyEvaluation(), false);
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous;
    if (marker === undefined) delete process.env.FACT_DESK_PREVIEW_ISOLATED; else process.env.FACT_DESK_PREVIEW_ISOLATED = marker;
    if (token === undefined) delete process.env.ADMIN_API_TOKEN; else process.env.ADMIN_API_TOKEN = token;
  }
});
