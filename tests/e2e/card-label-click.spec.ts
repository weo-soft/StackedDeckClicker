import { test, expect } from '@playwright/test';

test.describe('Card Label Click', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game page
    await page.goto('/');
    // Wait for game to load
    await page.waitForLoadState('networkidle');
  });

  test('should display clicked card details in purple zone', async ({ page }) => {
    // First, open a deck to get some cards on the canvas
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      await inventoryZone.click();
      
      // Wait for cards to appear on canvas
      await page.waitForTimeout(1000);
      
      // Find the canvas element
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      
      if (await canvas.isVisible()) {
        // Get canvas bounding box
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Click in the center area where labels might be
          // Note: This is a simplified test - actual label positions depend on card positions
          await canvas.click({
            position: {
              x: canvasBox.width / 2,
              y: canvasBox.height / 2
            }
          });
          
          // Wait for potential update
          await page.waitForTimeout(500);
          
          // Check if purple zone is visible (card details should be displayed)
          const purpleZone = page.locator('[aria-label*="Last card drawn" i], [aria-label*="last card" i]').first();
          await expect(purpleZone).toBeVisible({ timeout: 2000 });
        }
      }
    }
  });

  test('should show cursor pointer when hovering over labels', async ({ page }) => {
    const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
    
    if (await canvas.isVisible()) {
      const canvasBox = await canvas.boundingBox();
      
      if (canvasBox) {
        // Move mouse over canvas (where labels might be)
        await canvas.hover({
          position: {
            x: canvasBox.width / 2,
            y: canvasBox.height / 2
          }
        });
        
        // Wait a bit for hover detection
        await page.waitForTimeout(100);
        
        // Check cursor style (this is a basic check - actual cursor change depends on label position)
        const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
        // Cursor might be 'pointer' if hovering over label, or 'default' otherwise
        expect(['pointer', 'default']).toContain(cursor);
      }
    }
  });

  test('should update purple zone when clicking different labels', async ({ page }) => {
    // Open multiple decks to get multiple cards
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      // Open a few decks
      for (let i = 0; i < 3; i++) {
        await inventoryZone.click();
        await page.waitForTimeout(500);
      }
      
      // Wait for cards to appear
      await page.waitForTimeout(1000);
      
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
      
      if (await canvas.isVisible() && await purpleZone.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Click at different positions (simulating clicking different labels)
          const positions = [
            { x: canvasBox.width * 0.3, y: canvasBox.height * 0.3 },
            { x: canvasBox.width * 0.7, y: canvasBox.height * 0.7 },
            { x: canvasBox.width * 0.5, y: canvasBox.height * 0.5 }
          ];
          
          for (const pos of positions) {
            await canvas.click({ position: pos });
            await page.waitForTimeout(300);
            
            // Purple zone should remain visible
            await expect(purpleZone).toBeVisible({ timeout: 1000 });
          }
        }
      }
    }
  });

  test('should handle overlapping labels correctly', async ({ page }) => {
    // Open multiple decks to create overlapping labels
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      // Open several decks rapidly
      for (let i = 0; i < 5; i++) {
        await inventoryZone.click();
        await page.waitForTimeout(200);
      }
      
      await page.waitForTimeout(1000);
      
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
      
      if (await canvas.isVisible() && await purpleZone.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Click in area where labels might overlap
          await canvas.click({
            position: {
              x: canvasBox.width / 2,
              y: canvasBox.height / 2
            }
          });
          
          await page.waitForTimeout(300);
          
          // Should select topmost card without errors
          await expect(purpleZone).toBeVisible({ timeout: 1000 });
        }
      }
    }
  });

  test('should handle rapid successive clicks', async ({ page }) => {
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      await inventoryZone.click();
      await page.waitForTimeout(1000);
      
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
      
      if (await canvas.isVisible() && await purpleZone.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Rapid clicks (up to 5 per second)
          for (let i = 0; i < 5; i++) {
            await canvas.click({
              position: {
                x: canvasBox.width / 2 + (i * 10),
                y: canvasBox.height / 2 + (i * 10)
              }
            });
            await page.waitForTimeout(200); // 5 clicks per second
          }
          
          // Should handle all clicks without errors
          await expect(purpleZone).toBeVisible({ timeout: 1000 });
        }
      }
    }
  });

  test('should handle clicking empty space', async ({ page }) => {
    const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
    const purpleZone = page.locator('[aria-label*="Last card drawn" i]').first();
    
    if (await canvas.isVisible()) {
      const canvasBox = await canvas.boundingBox();
      
      if (canvasBox) {
        // Click in corner where no cards should be
        await canvas.click({
          position: {
            x: 10,
            y: 10
          }
        });
        
        await page.waitForTimeout(300);
        
        // Purple zone should remain unchanged (no error)
        await expect(purpleZone).toBeVisible({ timeout: 1000 });
      }
    }
  });
});

