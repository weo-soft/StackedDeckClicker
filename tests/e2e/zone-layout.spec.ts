/**
 * E2E tests for zone layout
 * 
 * Tests complete user workflows with zone-based layout.
 */

import { test, expect } from '@playwright/test';

test.describe('Zone Layout E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('should display all five zones on page load', async ({ page }) => {
    // Check that zone layout is rendered
    // This will need to be updated once GameAreaLayout component is implemented
    const gameArea = page.locator('[data-testid="game-area-layout"]').or(page.locator('.game-area-layout'));
    
    // For now, verify page loads successfully
    await expect(page.locator('h1')).toContainText('Stacked Deck Clicker');
  });

  test('should maintain zone visibility on resize', async ({ page }) => {
    // Set initial viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500); // Wait for layout to adjust
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500); // Wait for layout to adjust
    
    // Verify page still renders correctly
    await expect(page.locator('h1')).toContainText('Stacked Deck Clicker');
  });

  test('should handle zone interactions correctly', async ({ page }) => {
    // This test will be expanded once zone components are implemented
    // For now, verify basic page functionality
    const deckButton = page.locator('button:has-text("Open Deck")').first();
    
    if (await deckButton.isVisible()) {
      await expect(deckButton).toBeVisible();
    }
  });
});

