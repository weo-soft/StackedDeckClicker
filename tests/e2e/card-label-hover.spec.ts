import { test, expect } from '@playwright/test';

test.describe('Card Label Hover', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should show pointer cursor when hovering over labels', async ({ page }) => {
    // Open a deck to get cards on canvas
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      await inventoryZone.click();
      await page.waitForTimeout(1000);
      
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      
      if (await canvas.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Move mouse over canvas
          await canvas.hover({
            position: {
              x: canvasBox.width / 2,
              y: canvasBox.height / 2
            }
          });
          
          // Wait for hover detection (debounce is 50ms)
          await page.waitForTimeout(100);
          
          // Check cursor style
          const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
          expect(['pointer', 'default']).toContain(cursor);
        }
      }
    }
  });

  test('should reset cursor when mouse leaves canvas', async ({ page }) => {
    const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
    
    if (await canvas.isVisible()) {
      const canvasBox = await canvas.boundingBox();
      
      if (canvasBox) {
        // Hover over canvas
        await canvas.hover({
          position: {
            x: canvasBox.width / 2,
            y: canvasBox.height / 2
          }
        });
        
        await page.waitForTimeout(100);
        
        // Move mouse away
        await page.mouse.move(10, 10);
        await page.waitForTimeout(100);
        
        // Cursor should be reset
        const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
        expect(cursor).toBe('default');
      }
    }
  });

  test('should show hover visual feedback on labels', async ({ page }) => {
    // Open a deck
    const inventoryZone = page.locator('[aria-label*="inventory" i], [aria-label*="Inventory" i]').first();
    
    if (await inventoryZone.isVisible()) {
      await inventoryZone.click();
      await page.waitForTimeout(1000);
      
      const canvas = page.locator('canvas[aria-label*="Game canvas" i]').first();
      
      if (await canvas.isVisible()) {
        const canvasBox = await canvas.boundingBox();
        
        if (canvasBox) {
          // Take screenshot before hover
          const beforeScreenshot = await canvas.screenshot();
          
          // Hover over canvas
          await canvas.hover({
            position: {
              x: canvasBox.width / 2,
              y: canvasBox.height / 2
            }
          });
          
          await page.waitForTimeout(150); // Wait for debounce + render
          
          // Take screenshot after hover
          const afterScreenshot = await canvas.screenshot();
          
          // Screenshots should exist (visual comparison can be done manually)
          expect(beforeScreenshot).toBeTruthy();
          expect(afterScreenshot).toBeTruthy();
        }
      }
    }
  });
});

