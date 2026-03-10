import { test, expect } from "@playwright/test";

test.describe("Landing page pricing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("displays 3 pricing tiers: Base, Pro, Enterprise", async ({ page }) => {
    // Check for all three plan names
    await expect(page.getByText("Base")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();
  });

  test("shows correct pricing amounts", async ({ page }) => {
    await expect(page.getByText("$12.99")).toBeVisible();
    await expect(page.getByText("$19.99")).toBeVisible();
    await expect(page.getByText("$79.99")).toBeVisible();
  });

  test("shows 41 categories in hero stats", async ({ page }) => {
    await expect(page.getByText("41")).toBeVisible();
  });

  test("does not show old Bundle or $39.99 one-time references", async ({
    page,
  }) => {
    const content = await page.textContent("body");
    expect(content).not.toContain("Bundle");
    expect(content).not.toContain("$39.99");
    expect(content).not.toContain("One-time purchase");
  });

  test("does not show old Team tier at $39/mo", async ({ page }) => {
    const content = await page.textContent("body");
    expect(content).not.toContain("$39/mo");
  });
});
