import { expect, test } from "@playwright/test";

const categories = ["Politics", "Markets", "Technology", "World", "Health", "Courts", "Energy", "Culture"];
const leadSelector = 'main section[aria-label="Leading unreviewed discovery"]';

for (const category of categories) {
  test(`${category}: populated, source-linked and truthful`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`/?category=${category}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("tab", { name: new RegExp(`^${category}`) })).toHaveAttribute("aria-selected", "true");
    const lead = page.locator(leadSelector);
    await expect(lead).toBeVisible();
    await expect(lead).toContainText("source report · unreviewed");
    const title = lead.locator("a").first();
    await expect(title).not.toHaveText("");
    const url = new URL((await title.getAttribute("href"))!);
    expect(url.protocol).toBe("https:");
    expect(url.username + url.password).toBe("");
    await expect(title).toHaveAttribute("rel", /noopener/);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
}

test("category controls navigate and show eight distinct category leads", async ({ page }) => {
  await page.goto("/");
  const urls = new Set<string>();
  for (const category of categories) {
    const tab = page.getByRole("tab", { name: new RegExp(`^${category}`) });
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await expect(page).toHaveURL(new RegExp(`category=${category}`));
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const lead = page.locator(leadSelector);
    await expect(lead).toBeVisible();
    urls.add((await lead.locator("a").first().getAttribute("href"))!);
  }
  expect(urls.size).toBe(categories.length);
});

test("scheduled health is fresh, complete and from the reviewed producer", async ({ request }) => {
  const response = await request.get("/api/feed-health");
  expect(response.status()).toBe(200);
  const health = await response.json();
  expect(["healthy", "degraded"]).toContain(health.status);
  expect(health.schedulerObserved).toBe(true);
  expect(health.producer.event).toBe("schedule");
  expect(health.sourceSha).toBe(process.env.FACT_DESK_EXPECTED_PRODUCER_SHA ?? "66dd22d4454702390c9a15ab544447906cf4cb92");
  for (const category of categories) expect(health.categories[category]).toBeGreaterThan(0);
  expect(health.ageMs).toBeLessThanOrEqual(30 * 60 * 1000);
});
