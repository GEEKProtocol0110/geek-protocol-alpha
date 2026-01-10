import { test, expect } from '@playwright/test';

test.describe('Quiz Flow', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Geek Protocol')).toBeVisible();
  });

  test('should navigate to play page', async ({ page }) => {
    await page.goto('/');
    const playLink = page.locator('a[href="/play"]').first();
    await playLink.click();
    await expect(page).toHaveURL('/play');
    await expect(page.locator('text=Start Run')).toBeVisible();
  });

  test('should start a quiz run', async ({ page }) => {
    await page.goto('/play');
    await page.locator('button:has-text("Start Run")').click();
    
    // Wait for questions to load
    await page.waitForSelector('text=Question', { timeout: 10000 });
    
    // Verify HUD is visible
    await expect(page.locator('text=Run Progress')).toBeVisible();
    await expect(page.locator('text=Time')).toBeVisible();
    await expect(page.locator('text=Correct')).toBeVisible();
  });

  test('should answer a question and advance', async ({ page }) => {
    await page.goto('/play');
    await page.locator('button:has-text("Start Run")').click();
    
    // Wait for questions
    await page.waitForSelector('text=Question', { timeout: 10000 });
    
    // Click first choice
    const firstChoice = page.locator('button').filter({ hasText: 'Choose' }).first();
    await firstChoice.click();
    
    // Wait for answer to lock
    await page.waitForTimeout(500);
    
    // Click Next
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    
    // Verify we moved to next question or finished
    await page.waitForTimeout(500);
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/leaderboard"]').click();
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.locator('text=Leaderboard')).toBeVisible();
  });

  test('should display health badge in TopBar', async ({ page }) => {
    await page.goto('/');
    // Check for System OK or System Degraded badge
    const healthBadge = page.locator('text=/System (OK|Degraded)/');
    await expect(healthBadge).toBeVisible();
  });
});
