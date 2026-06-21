import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("recorder menu loads and passes axe", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /what would you like to record/i })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations.filter((v) => v.impact === "critical")).toEqual([]);
});

test("can open audio recorder mode", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /record audio/i }).click();
  await expect(page.getByRole("button", { name: /start recording/i })).toBeVisible();
});
