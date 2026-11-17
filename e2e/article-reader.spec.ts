import { expect, test } from "@playwright/test";

const categories = ["Politics", "Markets", "Technology", "World", "Health", "Courts", "Energy", "Culture"];

test("all eight article routes retain their title, source citations and bounded context", async ({ page, request }) => {
  const response = await request.get("https://raw.githubusercontent.com/andrewcrising/the-fact-desk/data/evaluation-live-feed/discovery.json");
  expect(response.ok()).toBe(true);
  const snapshot = await response.json();
  for (const category of categories) {
    const story = snapshot.stories.find((s: { category: string }) => s.category === category);
    expect(story, `${category} snapshot coverage`).toBeTruthy();
    expect((await page.goto(`/story/${encodeURIComponent(story.slug)}`))?.status()).toBe(200);
    const article = page.locator("main article");
    await expect(article.getByRole("heading", { level: 1 })).toHaveText(story.title);
    await expect(article.getByText("Single-source", { exact: true })).toBeVisible();
    for (const label of ["What happened", "Why it matters"]) {
      await expect(article.getByRole("heading", { name: label, exact: true }).locator("..").locator("p")).not.toHaveText("");
    }
    const links = await article.locator('a[target="_blank"]').evaluateAll((nodes) => nodes.map((node) => ({
      href: (node as HTMLAnchorElement).href, rel: (node as HTMLAnchorElement).rel,
    })));
    for (const url of story.sourceUrls) {
      expect(links.some((link) => link.href === url && link.rel.includes("noopener"))).toBe(true);
    }
  }
});

test("scrolling tickers are focusable and support keyboard scrolling", async ({ page }) => {
  await page.goto("/");
  for (const label of ["Desk signal ticker", "Health desk goals ticker"]) {
    const region = page.getByRole("region", { name: label, exact: true });
    await expect(region).toBeVisible();
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();
    const metrics = await region.evaluate((node) => ({ width: node.clientWidth, full: node.scrollWidth }));
    if (metrics.full > metrics.width) {
      await region.press("ArrowRight");
      await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    }
  }
});

test("local public-reader mode denies inherited admin and cron credentials over real HTTP", async ({ request, baseURL }) => {
  test.skip(process.env.FACT_DESK_E2E_LOCAL !== "true", "Never send mutation probes to a remote deployment");
  expect(new URL(baseURL!).hostname).toBe("127.0.0.1");
  const admin = { authorization: "Bearer local-reader-admin-fixture" };
  const cron = { authorization: "Bearer local-reader-cron-fixture" };
  expect((await request.post("/api/stories", { headers: admin, data: { title: "Must never persist" } })).status()).toBe(401);
  expect((await request.put("/api/stories/00000000-0000-0000-0000-000000000001/sources/00000000-0000-0000-0000-000000000002/review", {
    headers: admin, data: { originId: "must-never-attest", expectedUrl: "https://example.com/source" },
  })).status()).toBe(401);
  expect((await request.get("/api/cron/revalidate-live", { headers: cron })).status()).toBe(401);
  expect((await request.post("/api/automation/run-briefing-pipeline", { headers: cron, data: {} })).status()).toBe(401);
  expect((await request.post("/api/newsletter/signup", { data: { email: "reader-fixture@example.test" } })).status()).toBe(503);
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("local-inherited-service-fixture");
  expect(html).not.toContain("local-reader-admin-fixture");
});
