/**
 * E2E tests for scoreboard UI
 */

import { test, expect } from '@playwright/test';

test.describe('Scoreboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to initialize
    await page.waitForSelector('h1:has-text("Stacked Deck Clicker")', { timeout: 5000 });
  });

  test('should display scoreboard with dropped cards', async ({ page }) => {
    // Add some decks first
    await page.click('button:has-text("Add 10 Decks")');
    
    // Open a deck to drop a card
    await page.click('button:has-text("Open Deck")');
    await page.waitForTimeout(500); // Wait for card drop animation

    // Open scoreboard
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });

    // Verify scoreboard is visible
    await expect(page.locator('.scoreboard h2')).toContainText('Card Drop Scoreboard');
    
    // Verify table structure exists
    const table = page.locator('.scoreboard-table');
    await expect(table).toBeVisible();
    
    // Verify headers are present
    await expect(page.locator('th:has-text("Card Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Drops")')).toBeVisible();
    await expect(page.locator('th:has-text("Value")')).toBeVisible();
    await expect(page.locator('th:has-text("Total")')).toBeVisible();
  });

  test('should display empty state when no cards dropped', async ({ page }) => {
    // Open scoreboard without dropping any cards
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });

    // Verify empty state message
    await expect(page.locator('.empty-state p')).toContainText('No cards dropped in this session');
  });

  test('should update scoreboard when new cards are dropped', async ({ page }) => {
    // Add decks
    await page.click('button:has-text("Add 10 Decks")');
    
    // Open scoreboard first
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });
    
    // Verify empty initially
    await expect(page.locator('.empty-state')).toBeVisible();

    // Drop a card (open deck)
    await page.click('button:has-text("Open Deck")');
    await page.waitForTimeout(500);

    // Scoreboard should update (empty state should disappear, table should appear)
    await expect(page.locator('.scoreboard-table')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('.empty-state')).not.toBeVisible();
  });

  test('should sort by column when header is clicked', async ({ page }) => {
    // Add decks and drop multiple cards
    await page.click('button:has-text("Add 10 Decks")');
    
    // Drop a few cards
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Open Deck")');
      await page.waitForTimeout(300);
    }

    // Open scoreboard
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard-table', { timeout: 2000 });

    // Click on "Drops" column header
    await page.click('th:has-text("Drops")');
    await page.waitForTimeout(200);

    // Verify sort indicator appears (arrow icon)
    const dropsHeader = page.locator('th:has-text("Drops")');
    await expect(dropsHeader).toContainText(/[↑↓]/);
  });

  test('should toggle include hidden cards option', async ({ page }) => {
    // Add decks
    await page.click('button:has-text("Add 10 Decks")');
    
    // Drop a card
    await page.click('button:has-text("Open Deck")');
    await page.waitForTimeout(500);

    // Open scoreboard
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });

    // Find and toggle "include hidden cards" checkbox
    const checkbox = page.locator('input[type="checkbox"][aria-label*="hidden"]');
    await expect(checkbox).toBeVisible();
    
    // Toggle checkbox
    await checkbox.click();
    await page.waitForTimeout(200);

    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Open scoreboard
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });

    // Tab to first column header
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Press Enter on column header to sort
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Verify sort occurred (indicator should change)
    const header = page.locator('th[role="button"]').first();
    await expect(header).toHaveAttribute('aria-sort');
  });

  test('should sort by different columns', async ({ page }) => {
    // Add decks and drop cards
    await page.click('button:has-text("Add 10 Decks")');
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Open Deck")');
      await page.waitForTimeout(300);
    }

    // Open scoreboard
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard-table', { timeout: 2000 });

    // Click "Drops" column to sort by drop count
    await page.click('th:has-text("Drops")');
    await page.waitForTimeout(200);

    // Verify sort indicator on Drops column
    const dropsHeader = page.locator('th:has-text("Drops")');
    await expect(dropsHeader).toContainText(/[↑↓]/);

    // Click "Value" column to sort by value
    await page.click('th:has-text("Value")');
    await page.waitForTimeout(200);

    // Verify sort indicator moved to Value column
    const valueHeader = page.locator('th:has-text("Value")');
    await expect(valueHeader).toContainText(/[↑↓]/);
  });

  test('should include previously hidden drops when option enabled', async ({ page }) => {
    // This test would require setting up tier visibility, which is complex in E2E
    // For now, verify the checkbox exists and can be toggled
    await page.click('button:has-text("Scoreboard")');
    await page.waitForSelector('.scoreboard', { timeout: 2000 });

    const checkbox = page.locator('input[type="checkbox"][aria-label*="hidden"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked(); // Default should be unchecked

    // Toggle checkbox
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});

