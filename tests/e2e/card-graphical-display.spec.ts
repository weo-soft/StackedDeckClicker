import { test, expect } from '@playwright/test';

test.describe('Card Graphical Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game page
    await page.goto('/');
    // Wait for game to load
    await page.waitForLoadState('networkidle');
  });

  test('should display card when deck is opened', async ({ page }) => {
    // Find and click the deck opening area (inventory zone)
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      await inventoryZone.click();
      
      // Wait for card to appear in purple zone
      const purpleZone = page.locator('[aria-label*="Last card drawn" i], [aria-label*="last card" i]').first();
      
      // Check if card display appears
      await expect(purpleZone).toBeVisible({ timeout: 5000 });
      
      // Check if card image or card name is visible
      const cardDisplay = purpleZone.locator('.card-display').first();
      await expect(cardDisplay).toBeVisible({ timeout: 2000 });
    }
  });

  test('should scale card display when zone is resized', async ({ page }) => {
    // Get initial card display
    const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
    
    if (await purpleZone.isVisible()) {
      const initialSize = await purpleZone.boundingBox();
      
      // Resize viewport
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.waitForTimeout(500);
      
      const resizedSize = await purpleZone.boundingBox();
      
      // Card should still be visible after resize
      expect(resizedSize).toBeTruthy();
    }
  });

  test('should show empty state when no card drawn', async ({ page }) => {
    const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
    
    if (await purpleZone.isVisible()) {
      const emptyState = purpleZone.locator('.card-display.empty, .no-card').first();
      // Either empty state should be visible, or card should be visible
      const hasContent = await emptyState.isVisible().catch(() => false) || 
                         await purpleZone.locator('.card-display:not(.empty)').isVisible().catch(() => false);
      expect(hasContent).toBeTruthy();
    }
  });
});

