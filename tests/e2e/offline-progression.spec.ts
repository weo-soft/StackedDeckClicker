import { test, expect } from '@playwright/test';

test.describe('Offline Progression E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('text=Decks Available', { timeout: 5000 });
  });

  test('should display offline progression summary when returning', async ({ page }) => {
    // Placeholder test - will be updated when UI is implemented
    // This test will:
    // 1. Enable auto-opening upgrade
    // 2. Save game state
    // 3. Simulate time passage (or wait)
    // 4. Reload page
    // 5. Verify offline progression summary is displayed
    await expect(page.locator('h1')).toContainText('Stacked Deck Clicker');
  });
});

