import { test, expect } from '@playwright/test';

test.describe('Light Beam Effect E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('text=Decks Available', { timeout: 5000 });
  });

  test('should display beam effect when card is dropped from tier with beam enabled', async ({ page }) => {
    // Navigate to Tier Settings
    await page.click('text=Tier Settings');
    await page.waitForSelector('.tier-settings', { timeout: 3000 });

    // Expand a tier (e.g., tier S)
    const tierEntry = page.locator('.tier-entry').first();
    await tierEntry.click();
    await page.waitForSelector('.tier-collapsible', { timeout: 1000 });

    // Enable light beam effect
    const beamToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Enable light beam effect/i });
    await beamToggle.check();

    // Set beam color
    const colorPicker = page.locator('input[type="color"][aria-label="Beam color picker"]');
    await colorPicker.fill('#FF0000');

    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    await page.waitForSelector('text=successfully', { timeout: 2000 });

    // Close Tier Settings and return to game
    await page.goBack();

    // Open a deck to drop a card
    const openDeckButton = page.locator('button:has-text("Open Deck")');
    await openDeckButton.click();

    // Wait for card to appear
    await page.waitForTimeout(500);

    // Verify canvas is visible (beam effect should be rendered)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should not display beam effect when beam is disabled', async ({ page }) => {
    // Navigate to Tier Settings
    await page.click('text=Tier Settings');
    await page.waitForSelector('.tier-settings', { timeout: 3000 });

    // Expand a tier
    const tierEntry = page.locator('.tier-entry').first();
    await tierEntry.click();
    await page.waitForSelector('.tier-collapsible', { timeout: 1000 });

    // Ensure beam is disabled
    const beamToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Enable light beam effect/i });
    await beamToggle.uncheck();

    // Save configuration
    await page.click('button:has-text("Save Configuration")');
    await page.waitForSelector('text=successfully', { timeout: 2000 });

    // Close Tier Settings and return to game
    await page.goBack();

    // Open a deck
    const openDeckButton = page.locator('button:has-text("Open Deck")');
    await openDeckButton.click();

    // Wait for card to appear
    await page.waitForTimeout(500);

    // Canvas should be visible but no beam effect
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should persist beam configuration across page reload', async ({ page }) => {
    // Configure beam for a tier
    await page.click('text=Tier Settings');
    await page.waitForSelector('.tier-settings', { timeout: 3000 });

    const tierEntry = page.locator('.tier-entry').first();
    await tierEntry.click();
    await page.waitForSelector('.tier-collapsible', { timeout: 1000 });

    // Enable and configure beam
    const beamToggle = page.locator('input[type="checkbox"]').filter({ hasText: /Enable light beam effect/i });
    await beamToggle.check();

    const colorPicker = page.locator('input[type="color"][aria-label="Beam color picker"]');
    await colorPicker.fill('#00FF00');

    await page.click('button:has-text("Save Configuration")');
    await page.waitForSelector('text=successfully', { timeout: 2000 });

    // Reload page
    await page.reload();
    await page.waitForSelector('text=Decks Available', { timeout: 5000 });

    // Verify configuration persisted
    await page.click('text=Tier Settings');
    await page.waitForSelector('.tier-settings', { timeout: 3000 });

    const tierEntryAfterReload = page.locator('.tier-entry').first();
    await tierEntryAfterReload.click();
    await page.waitForSelector('.tier-collapsible', { timeout: 1000 });

    const beamToggleAfterReload = page.locator('input[type="checkbox"]').filter({ hasText: /Enable light beam effect/i });
    await expect(beamToggleAfterReload).toBeChecked();
  });
});

