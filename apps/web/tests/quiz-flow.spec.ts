import { test, expect } from "@playwright/test";

/**
 * These tests replace an earlier suite that asserted a UI which no longer
 * exists: a "Start Run" button and a "Run Progress / Time / Correct" HUD on
 * `/play`, and a "System OK" health badge. `/play` is now a redirect to the
 * Gauntlet setup screen, and the health badge was removed. Those tests had been
 * failing on `main` before the economy work — the home-page assertion also used
 * `text=Geek Protocol`, which matched eight elements and tripped Playwright's
 * strict mode.
 *
 * What is covered now is the current product, with emphasis on the claims the
 * site is contractually required to keep honest (ECONOMY.md §19). A marketing
 * regression here is a trust problem, not a cosmetic one, so it is worth a test.
 */

test.describe("Home page", () => {
  test("renders the product name", async ({ page }) => {
    await page.goto("/");
    // Specific role-based locator: "Geek Protocol" appears in body copy many
    // times, so a bare text match is ambiguous by construction.
    await expect(page).toHaveTitle(/Geek Protocol/i);
    await expect(page.getByRole("heading", { name: /Geek Gauntlet/i })).toBeVisible();
  });

  test("shows the Public Alpha status banner", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("status", { name: /platform status/i });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Public Alpha/i);
    await expect(banner).toContainText(/not enabled/i);
  });

  test("does not claim on-chain settlement or instant payouts", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();

    // The specific claims the litepaper contradicted.
    expect(body).not.toMatch(/settlement lands on kaspa/i);
    expect(body).not.toMatch(/finality in milliseconds/i);
    expect(body).not.toMatch(/paid in \$?GEEK the moment you finish/i);
    expect(body).not.toMatch(/fastest smart[- ]contract/i);
    expect(body).not.toMatch(/krc-?20 native/i);
    expect(body).not.toMatch(/staking rewards/i);
    expect(body).not.toMatch(/team\s*(&|and)\s*advisors/i);
  });

  test("does not render zeroed placeholder counters", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();

    // The animated counters used to seed at 0, so the served HTML said
    // "0 categories" and "0-second timer".
    expect(body).not.toMatch(/\b0 categories\b/i);
    expect(body).not.toMatch(/\b0 questions\b/i);
    expect(body).not.toMatch(/under 0[- ]second/i);
  });
});

test.describe("Gauntlet round table", () => {
  test("renders round data or an honest unavailable message", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("table").first();

    // The table is served by the API. Either it rendered with live values, or
    // the API was unreachable and the page says so — never stale hardcoded
    // numbers, and never a table of zeros.
    const tableVisible = await section.isVisible().catch(() => false);

    if (tableVisible) {
      await expect(section).toContainText("INITIATION");
      await expect(section).toContainText("Free");
      // Caption states the live per-question timer rather than a literal.
      await expect(section.locator("caption")).toContainText(/seconds per question/i);
    } else {
      await expect(page.getByText(/could not be reached/i)).toBeVisible();
    }
  });
});

test.describe("Navigation", () => {
  test("play redirects to the Gauntlet setup screen", async ({ page }) => {
    await page.goto("/play");
    // Setup requires an account, so an unauthenticated visitor lands on login.
    await expect(page).toHaveURL(/\/(gauntlet\/setup|auth\/login)/);
  });

  test("leaderboard loads and shows rows or an actionable empty state", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/);

    const empty = page.getByText(/No ranked players yet/i);
    const rows = page.getByText(/Top 50 players/i);
    await expect(empty.or(rows).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Legal and support pages", () => {
  const PAGES: Array<[string, RegExp]> = [
    ["/legal/terms", /Terms of Use/i],
    ["/legal/privacy", /Privacy Policy/i],
    ["/legal/risk", /Alpha Risk Disclosure/i],
    ["/legal/acceptable-use", /Acceptable Use Policy/i],
    ["/legal/community-content", /Community Content Terms/i],
    ["/legal/cookies", /Cookie Notice/i],
    ["/support/report", /Report a problem/i],
  ];

  for (const [path, heading] of PAGES) {
    test(`${path} resolves`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    });
  }

  test("the risk disclosure states balances are not withdrawable", async ({ page }) => {
    await page.goto("/legal/risk");
    await expect(page.getByText(/cannot withdraw/i).first()).toBeVisible();
  });

  test("the privacy policy discloses the custodial wallet arrangement", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.getByRole("heading", { name: /Custodial wallet disclosure/i })).toBeVisible();
  });

  test("footer legal links are real destinations, not placeholders", async ({ page }) => {
    await page.goto("/");
    const terms = page.locator('a[href="/legal/terms"]').first();
    await expect(terms).toHaveCount(1);
    // The previous footers linked Terms and Privacy to "#" and "/".
    await expect(page.locator('footer a[href="#"]')).toHaveCount(0);
  });
});
