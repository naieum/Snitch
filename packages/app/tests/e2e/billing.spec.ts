import { test, expect } from "@playwright/test";

test.describe("Dashboard billing page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the billing API to return a free user
    await page.route("/api/billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tier: "free",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          status: null,
          granted: false,
        }),
      });
    });

    // Mock auth to not redirect
    await page.route("/api/auth/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: { id: "test" }, user: { id: "test-user" } }),
      });
    });
  });

  test("shows 4 plans: Free, Base, Pro, Enterprise", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    const headers = page.locator("thead th");
    const headerTexts = await headers.allTextContents();

    expect(headerTexts).toContain("Free");
    expect(headerTexts).toContain("Base");
    expect(headerTexts).toContain("Pro");
    expect(headerTexts).toContain("Enterprise");
  });

  test("shows correct prices in comparison table", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    const tableText = await page.locator("table").textContent();
    expect(tableText).toContain("$0");
    expect(tableText).toContain("$12.99/mo");
    expect(tableText).toContain("$19.99/mo");
    expect(tableText).toContain("$79.99/mo");
  });

  test("does not show old bundle or team tiers", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    const tableText = await page.locator("table").textContent();
    expect(tableText).not.toContain("Bundle");
    expect(tableText).not.toContain("Team");
  });

  test("shows category counts in comparison table", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    const tableText = await page.locator("table").textContent();
    expect(tableText).toContain("20");
    expect(tableText).toContain("31");
    expect(tableText).toContain("41");
  });

  test("free user sees upgrade buttons for paid tiers", async ({ page }) => {
    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    const upgradeButtons = page.getByRole("button", { name: "Upgrade" });
    const count = await upgradeButtons.count();
    expect(count).toBe(3); // Base, Pro, Enterprise
  });

  test("upgrade button sends correct tier to checkout", async ({ page }) => {
    let checkoutPayload: any = null;

    await page.route("/api/stripe/checkout", async (route) => {
      checkoutPayload = JSON.parse(route.request().postData() ?? "{}");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://checkout.stripe.com/test" }),
      });
    });

    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    // Click the first "Upgrade" button (Base tier)
    await page.getByRole("button", { name: "Upgrade" }).first().click();

    expect(checkoutPayload).toBeTruthy();
    expect(checkoutPayload.tier).toBe("base");
  });

  test("pro user sees Current plan on Pro column", async ({ page }) => {
    await page.route("/api/billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tier: "pro",
          stripeCustomerId: "cus_test",
          stripeSubscriptionId: "sub_test",
          status: "active",
          granted: false,
        }),
      });
    });

    await page.goto("/dashboard/billing");
    await page.waitForSelector("table");

    await expect(page.getByText("Current plan")).toBeVisible();
  });

  test("granted user shows Granted status badge", async ({ page }) => {
    await page.route("/api/billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tier: "pro",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          status: null,
          granted: true,
        }),
      });
    });

    await page.goto("/dashboard/billing");
    await expect(page.getByText("Granted")).toBeVisible();
  });

  test("granted user does not see Manage Subscription button", async ({ page }) => {
    await page.route("/api/billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tier: "pro",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          status: null,
          granted: true,
        }),
      });
    });

    await page.goto("/dashboard/billing");
    await expect(page.getByText("Manage Subscription")).not.toBeVisible();
  });

  test("active subscriber sees Manage Subscription button", async ({ page }) => {
    await page.route("/api/billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tier: "pro",
          stripeCustomerId: "cus_test",
          stripeSubscriptionId: "sub_test",
          status: "active",
          granted: false,
        }),
      });
    });

    await page.goto("/dashboard/billing");
    await expect(page.getByRole("button", { name: "Manage Subscription" })).toBeVisible();
  });
});
