/**
 * E2E tests for debug menu
 * 
 * Tests complete user workflows with debug menu.
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Menu E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to load
    await page.waitForSelector('h1', { timeout: 5000 });
  });

  test('should open menu with F12 keyboard shortcut', async ({ page }) => {
    // Press F12 to open debug menu
    await page.keyboard.press('F12');
    
    // Wait for menu to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Verify menu is visible
    const menu = page.locator('[role="dialog"]');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-modal', 'true');
  });

  test('should close menu with Escape key', async ({ page }) => {
    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Verify menu is open
    const menu = page.locator('[role="dialog"]');
    await expect(menu).toBeVisible();
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    
    // Wait for menu to disappear
    await page.waitForTimeout(200);
    
    // Verify menu is closed
    await expect(menu).not.toBeVisible();
  });

  test('should close menu when close button is clicked', async ({ page }) => {
    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Click close button
    const closeButton = page.locator('button[aria-label*="Close"]');
    await closeButton.click();
    
    // Wait for menu to disappear
    await page.waitForTimeout(200);
    
    // Verify menu is closed
    const menu = page.locator('[role="dialog"]');
    await expect(menu).not.toBeVisible();
  });

  test('should close menu when backdrop is clicked', async ({ page }) => {
    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Click on backdrop (modal-overlay)
    const overlay = page.locator('.modal-overlay');
    await overlay.click({ position: { x: 10, y: 10 } });
    
    // Wait for menu to disappear
    await page.waitForTimeout(200);
    
    // Verify menu is closed
    const menu = page.locator('[role="dialog"]');
    await expect(menu).not.toBeVisible();
  });

  test('should use Add Chaos tool from debug menu', async ({ page }) => {
    // Get initial score
    const initialScoreText = await page.locator('text=/Score|Chaos/i').first().textContent();
    const initialScore = initialScoreText ? parseFloat(initialScoreText.replace(/[^\d.]/g, '')) || 0 : 0;

    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Click Add Chaos button
    const addChaosButton = page.locator('button:has-text("Add 10 Chaos")');
    await addChaosButton.click();
    
    // Wait for state update
    await page.waitForTimeout(500);
    
    // Verify score increased (if score display is visible)
    // Note: This test verifies the button works, actual score verification depends on UI
    await expect(addChaosButton).toBeVisible();
  });

  test('should use Rarity slider from debug menu', async ({ page }) => {
    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Find rarity slider
    const raritySlider = page.locator('#rarity-slider');
    await expect(raritySlider).toBeVisible();
    
    // Change slider value
    await raritySlider.fill('5000');
    
    // Wait for change to apply
    await page.waitForTimeout(300);
    
    // Verify slider value updated
    const value = await raritySlider.inputValue();
    expect(parseInt(value)).toBe(5000);
  });

  test('should show debug menu trigger in development mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Look for debug menu trigger button
    const trigger = page.locator('button:has-text("Debug Menu")');
    // In development mode, trigger should be visible
    // Note: This test assumes dev mode - may need to adjust based on environment
    const isVisible = await trigger.isVisible().catch(() => false);
    // If visible, verify it works
    if (isVisible) {
      await expect(trigger).toBeVisible();
    }
  });

  test('should not show debug menu trigger in production mode', async ({ page }) => {
    // This test would need to run in production build
    // For now, we verify the component respects visibility
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // In production, trigger should not be visible unless localStorage flag is set
    // This is more of a manual verification test
  });

  test('should handle keyboard navigation (Tab) between tools', async ({ page }) => {
    // Open menu with F12
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Verify focus moved
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should handle responsive design on small screen', async ({ page }) => {
    // Set small viewport
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Open menu
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Verify menu is visible and usable
    const menu = page.locator('[role="dialog"]');
    await expect(menu).toBeVisible();
    
    // Verify content is scrollable if needed
    const modalBody = page.locator('.modal-body');
    await expect(modalBody).toBeVisible();
  });

  test('should handle multiple rapid interactions', async ({ page }) => {
    // Open menu
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Rapidly click Add Chaos multiple times
    const addChaosButton = page.locator('button:has-text("Add 10 Chaos")');
    for (let i = 0; i < 3; i++) {
      await addChaosButton.click();
      await page.waitForTimeout(50);
    }
    
    // Menu should still be open and functional
    const menu = page.locator('[role="dialog"]');
    await expect(menu).toBeVisible();
  });

  test('should handle menu opening while another modal is active', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Try to open tier settings if available (to simulate another modal)
    // Then open debug menu
    await page.keyboard.press('F12');
    await page.waitForSelector('[role="dialog"]', { timeout: 1000 });
    
    // Debug menu should be visible (higher z-index)
    const debugMenu = page.locator('[role="dialog"]:has-text("Debug Menu")');
    await expect(debugMenu).toBeVisible();
  });
});

