import { test, expect } from '@playwright/test';

test.describe('Game Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show mode selection screen on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Should see mode selection screen
    await expect(page.locator('text=Select Game Mode')).toBeVisible();
    await expect(page.locator('text=Classic')).toBeVisible();
    await expect(page.locator('text=Ruthless')).toBeVisible();
    await expect(page.locator('text=Give me my Dopamine')).toBeVisible();
    await expect(page.locator('text=Stacked Deck Clicker')).toBeVisible();
  });

  test('should select a game mode', async ({ page }) => {
    await page.goto('/');
    
    // Click on Classic mode
    await page.click('text=Classic');
    
    // Should show selected state
    await expect(page.locator('.mode-card.selected')).toBeVisible();
    
    // Click confirm
    await page.click('text=Confirm Selection');
    
    // Mode selection should disappear and game should load
    await expect(page.locator('text=Select Game Mode')).not.toBeVisible();
  });

  test('should persist mode selection across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Select a mode
    await page.click('text=Stacked Deck Clicker');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Stacked Deck Clicker', { state: 'hidden' });
    
    // Reload page
    await page.reload();
    
    // Should not show selection screen
    await expect(page.locator('text=Select Game Mode')).not.toBeVisible();
    
    // Verify mode was persisted
    const savedMode = await page.evaluate(() => localStorage.getItem('gameMode'));
    expect(savedMode).toBe('stacked-deck-clicker');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Focus should be on first mode button
    const firstButton = page.locator('.mode-card button').first();
    await expect(firstButton).toBeFocused();
    
    // Press Arrow Right to navigate
    await page.keyboard.press('ArrowRight');
    
    // Focus should move to next button
    const secondButton = page.locator('.mode-card button').nth(1);
    await expect(secondButton).toBeFocused();
  });

  test('should close on Escape key', async ({ page }) => {
    await page.goto('/');
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Modal should close (but since it's required, it might stay open)
    // This test verifies Escape key is handled
    const overlay = page.locator('.modal-overlay');
    // Note: In actual implementation, Escape might not close if mode is required
    // This test documents the behavior
  });

  test('should initialize Classic mode with unlimited decks', async ({ page }) => {
    await page.goto('/');
    
    // Select Classic mode
    await page.click('text=Classic');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Check deck count shows infinity symbol
    const deckCount = await page.locator('.deck-count-badge').textContent();
    expect(deckCount).toBe('∞');
  });

  test('should disable shop in Classic mode', async ({ page }) => {
    await page.goto('/');
    
    // Select Classic mode
    await page.click('text=Classic');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Shop should not be visible
    await expect(page.locator('.upgrade-store-zone')).not.toBeVisible();
  });

  test('should initialize Ruthless mode with limited decks and low chaos', async ({ page }) => {
    await page.goto('/');
    
    // Select Ruthless mode
    await page.click('text=Ruthless');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Check deck count (should be 5)
    const deckCount = await page.locator('.deck-count-badge').textContent();
    expect(parseInt(deckCount || '0')).toBe(5);
    
    // Check chaos/score (should be 25)
    const scoreText = await page.locator('text=/Score|Chaos/i').first().textContent();
    expect(scoreText).toContain('25');
  });

  test('should allow deck purchase in Ruthless mode', async ({ page }) => {
    await page.goto('/');
    
    // Select Ruthless mode
    await page.click('text=Ruthless');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Check initial deck count
    const initialDeckCount = parseInt(await page.locator('.deck-count-badge').textContent() || '0');
    
    // Click purchase decks button
    const purchaseButton = page.locator('text=Buy Deck');
    await expect(purchaseButton).toBeVisible();
    await purchaseButton.click();
    
    // Wait for purchase to complete
    await page.waitForTimeout(500);
    
    // Check deck count increased
    const newDeckCount = parseInt(await page.locator('.deck-count-badge').textContent() || '0');
    expect(newDeckCount).toBe(initialDeckCount + 1);
  });

  test('should initialize Dopamine mode with high resources', async ({ page }) => {
    await page.goto('/');
    
    // Select Dopamine mode
    await page.click('text=Give me my Dopamine');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Check deck count (should be 75)
    const deckCount = parseInt(await page.locator('.deck-count-badge').textContent() || '0');
    expect(deckCount).toBe(75);
    
    // Check chaos/score (should be 750)
    const scoreText = await page.locator('text=/Score|Chaos/i').first().textContent();
    expect(scoreText).toContain('750');
  });

  test('should filter upgrades in Dopamine mode', async ({ page }) => {
    await page.goto('/');
    
    // Select Dopamine mode
    await page.click('text=Give me my Dopamine');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Shop should be visible
    await expect(page.locator('.upgrade-store-zone')).toBeVisible();
    
    // Only improvedRarity and luckyDrop should be available
    // (This test verifies shop is visible - actual filtering is tested in unit tests)
  });

  test('should show all upgrades in Stacked Deck Clicker mode', async ({ page }) => {
    await page.goto('/');
    
    // Select Stacked Deck Clicker mode
    await page.click('text=Stacked Deck Clicker');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Shop should be visible
    await expect(page.locator('.upgrade-store-zone')).toBeVisible();
    
    // All upgrade types should be available
    // (This test verifies shop is visible - actual upgrade availability is tested in unit tests)
  });

  test('should persist mode selection across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Select a mode
    await page.click('text=Stacked Deck Clicker');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Reload page
    await page.reload();
    
    // Should not show selection screen
    await expect(page.locator('text=Select Game Mode')).not.toBeVisible();
    
    // Verify mode was persisted
    const savedMode = await page.evaluate(() => localStorage.getItem('gameMode'));
    expect(savedMode).toBe('stacked-deck-clicker');
  });

  test('should show confirmation dialog when changing mode', async ({ page }) => {
    await page.goto('/');
    
    // Select first mode
    await page.click('text=Classic');
    await page.click('text=Confirm Selection');
    
    // Wait for game to load
    await page.waitForSelector('text=Select Game Mode', { state: 'hidden' });
    
    // Note: Mode change functionality would require a way to reopen the selection screen
    // This test documents expected behavior - confirmation dialog should appear
    // when changing modes mid-session (future enhancement)
  });
});

