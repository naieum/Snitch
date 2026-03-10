import { test, expect } from "@playwright/test";

test.describe("Admin user management", () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin auth
    await page.route("/api/auth/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: { id: "test" }, user: { id: "admin-user" } }),
      });
    });
  });

  test("user detail page shows 4 tier buttons: free, base, pro, enterprise", async ({
    page,
  }) => {
    await page.route("/api/admin/users/test-user-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          subscriptionTier: "free",
          createdAt: "2025-01-01T00:00:00Z",
          rulesets: [],
          projects: [],
          apiKeys: [],
        }),
      });
    });

    await page.goto("/admin/users/test-user-id");
    await page.waitForSelector("text=Change Tier");

    // Should have exactly these 4 tier buttons
    const tierButtons = page.locator("button", { hasText: /^(free|base|pro|enterprise)$/ });
    const count = await tierButtons.count();
    expect(count).toBe(4);

    await expect(page.getByRole("button", { name: "free", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "base", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "pro", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "enterprise", exact: true })).toBeVisible();
  });

  test("no bundle or team buttons exist", async ({ page }) => {
    await page.route("/api/admin/users/test-user-id", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
          subscriptionTier: "free",
          createdAt: "2025-01-01T00:00:00Z",
          rulesets: [],
          projects: [],
          apiKeys: [],
        }),
      });
    });

    await page.goto("/admin/users/test-user-id");
    await page.waitForSelector("text=Change Tier");

    await expect(page.getByRole("button", { name: "bundle", exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "team", exact: true })).not.toBeVisible();
  });

  test("change tier sends PATCH with correct tier", async ({ page }) => {
    let patchPayload: any = null;
    let patchUrl = "";

    await page.route("/api/admin/users/test-user-id", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: {
              id: "test-user-id",
              name: "Test User",
              email: "test@example.com",
              subscriptionTier: "free",
              createdAt: "2025-01-01T00:00:00Z",
              rulesets: [],
              projects: [],
              apiKeys: [],
            },
            keys: [],
            subscription: null,
          }),
        });
      }
    });

    await page.route("/api/admin/users/test-user-id/tier", async (route) => {
      patchPayload = JSON.parse(route.request().postData() ?? "{}");
      patchUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, tier: "pro" }),
      });
    });

    await page.goto("/admin/users/test-user-id");
    await page.waitForSelector("text=Change Tier");

    // Click the "pro" button
    await page.getByRole("button", { name: "pro", exact: true }).click();

    expect(patchPayload).toBeTruthy();
    expect(patchPayload.tier).toBe("pro");
  });

  test("users list shows correct tier badges", async ({ page }) => {
    await page.route("/api/admin/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "1", name: "Free User", email: "free@test.com", subscriptionTier: "free", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
          { id: "2", name: "Base User", email: "base@test.com", subscriptionTier: "base", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
          { id: "3", name: "Pro User", email: "pro@test.com", subscriptionTier: "pro", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
          { id: "4", name: "Enterprise User", email: "ent@test.com", subscriptionTier: "enterprise", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
        ]),
      });
    });

    await page.goto("/admin/users");
    await page.waitForSelector("table");

    // Check all tier badges exist
    await expect(page.locator("span", { hasText: "free" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "base" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "pro" }).first()).toBeVisible();
    await expect(page.locator("span", { hasText: "enterprise" }).first()).toBeVisible();

    // No bundle or team
    const tableText = await page.locator("table").textContent();
    expect(tableText).not.toContain("bundle");
    expect(tableText).not.toContain("team");
  });
});
