import { defineConfig, devices } from "@playwright/test";

const local = process.env.FACT_DESK_E2E_LOCAL === "true";
const baseURL = local ? "http://127.0.0.1:3000" :
  process.env.FACT_DESK_E2E_BASE_URL ?? "https://the-fact-desk-evaluation-20261113.vercel.app";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 15_000 },
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: local ? {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3000",
    url: baseURL,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      FACT_DESK_PREVIEW_ISOLATED: "true", FACT_DESK_SCHEDULED_DISCOVERY: "true", ALLOW_MOCK_FALLBACK: "false",
      ADMIN_API_TOKEN: "local-reader-admin-fixture", CRON_SECRET: "local-reader-cron-fixture",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "local-inherited-service-fixture",
    },
  } : undefined,
});
