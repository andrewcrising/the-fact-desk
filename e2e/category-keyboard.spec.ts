import { expect, test } from "@playwright/test";

test("category tabs support arrows, wraparound, Home and End with one keyboard stop", async ({ page }) => {
  await page.goto("/?category=Energy");
  const tabs = page.getByRole("tablist", { name: "Filter by category" });
  const energy = tabs.getByRole("tab", { name: /^Energy/ });
  const culture = tabs.getByRole("tab", { name: /^Culture/ });
  const all = tabs.getByRole("tab", { name: "All desks", exact: true });
  await energy.focus();
  await energy.press("ArrowRight");
  await expect(culture).toBeFocused();
  await expect(culture).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/category=Culture/);
  await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1);
  await culture.press("ArrowRight");
  await expect(all).toBeFocused();
  await expect(all).toHaveAttribute("aria-selected", "true");
  await expect(page).not.toHaveURL(/category=/);
  await all.press("ArrowLeft");
  await expect(culture).toBeFocused();
  await culture.press("Home");
  await expect(all).toBeFocused();
  await all.press("End");
  await expect(culture).toBeFocused();
  await expect(culture).toHaveAttribute("aria-selected", "true");
  await expect(tabs.locator('[tabindex="0"]')).toHaveCount(1);
});
