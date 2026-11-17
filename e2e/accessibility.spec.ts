import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/?category=Energy"]) {
  test(`WCAG accessibility: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main section[aria-label="Leading unreviewed discovery"]')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const violations = results.violations.map((v) => ({
      id: v.id, impact: v.impact, count: v.nodes.length,
      nodes: v.nodes.slice(0, 3).map((n) => ({ target: n.target, summary: n.failureSummary })),
    }));
    console.log("READER_ACCESSIBILITY", JSON.stringify(violations));
    expect(violations.map((v) => v.id), JSON.stringify(violations)).toEqual([]);
  });
}
