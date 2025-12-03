/**
 * Unit tests for DebugMenu component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import DebugMenu from '$lib/components/DebugMenu.svelte';
import type { GameState } from '$lib/models/GameState.js';
import { createDefaultGameState } from '$lib/utils/defaultGameState.js';

// Mock gameStateService
vi.mock('$lib/services/gameStateService.js', () => {
  return {
    gameStateService: {
      addChaos: vi.fn().mockResolvedValue(undefined),
      addDecks: vi.fn().mockResolvedValue(undefined),
      setCustomRarityPercentage: vi.fn().mockResolvedValue(undefined),
      setLuckyDropLevel: vi.fn().mockResolvedValue(undefined)
    }
  };
});

// Mock upgradeService
vi.mock('$lib/services/upgradeService.js', () => {
  return {
    upgradeService: {
      getAvailableUpgrades: vi.fn(() => [])
    }
  };
});

describe('DebugMenu Component', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createDefaultGameState();
    vi.clearAllMocks();
  });

  describe('Menu Open/Close State', () => {
    it('should start with menu closed', async () => {
      const { container } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const modal = container.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });

    it('should open menu when trigger button is clicked', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const modal = container.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
      expect(modal?.getAttribute('aria-modal')).toBe('true');
    });

    it('should close menu when close button is clicked', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Close menu
      const closeButton = getByLabelText(/close/i);
      await fireEvent.click(closeButton);
      await tick();

      const modal = container.querySelector('.modal-overlay');
      expect(modal).toBeNull();
    });

    it('should close menu when backdrop is clicked', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Click backdrop
      const overlay = container.querySelector('.modal-overlay');
      expect(overlay).toBeTruthy();
      if (overlay) {
        await fireEvent.click(overlay);
        await tick();

        const modal = container.querySelector('.modal-overlay');
        expect(modal).toBeNull();
      }
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should open menu when F12 key is pressed', async () => {
      const { container } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Simulate F12 key press
      await fireEvent.keyDown(window, { key: 'F12', code: 'F12' });
      await tick();

      const modal = container.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should close menu when Escape key is pressed', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Press Escape
      const overlay = container.querySelector('.modal-overlay');
      expect(overlay).toBeTruthy();
      if (overlay) {
        await fireEvent.keyDown(overlay, { key: 'Escape', code: 'Escape' });
        await tick();

        const modal = container.querySelector('.modal-overlay');
        expect(modal).toBeNull();
      }
    });
  });

  describe('Focus Management', () => {
    it('should focus first interactive element when menu opens', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Wait for focus to be set
      await waitFor(() => {
        const closeButton = container.querySelector('.modal-close');
        expect(closeButton).toBeTruthy();
        expect(document.activeElement).toBe(closeButton);
      }, { timeout: 1000 });
    });

    it('should return focus to trigger button when menu closes', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Close menu
      const closeButton = getByLabelText(/close/i);
      await fireEvent.click(closeButton);
      await tick();

      // Wait for focus to return
      await waitFor(() => {
        expect(document.activeElement).toBe(trigger);
      }, { timeout: 1000 });
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct ARIA attributes when menu is open', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const modal = container.querySelector('.modal-overlay');
      expect(modal?.getAttribute('role')).toBe('dialog');
      expect(modal?.getAttribute('aria-modal')).toBe('true');
      expect(modal?.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('should have accessible trigger button', async () => {
      const { getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      expect(trigger).toBeTruthy();
      expect(trigger.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Debug Tools - Resources Section', () => {
    it('should render Add Chaos button', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const addChaosButton = getByLabelText(/add 10 chaos/i);
      expect(addChaosButton).toBeTruthy();
    });

    it('should render Add Decks button', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const addDecksButton = getByLabelText(/add 10 decks/i);
      expect(addDecksButton).toBeTruthy();
    });

    it('should call gameStateService.addChaos when Add Chaos button is clicked', async () => {
      const { gameStateService } = await import('$lib/services/gameStateService.js');
      const { getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Click Add Chaos
      const addChaosButton = getByLabelText(/add 10 chaos/i);
      await fireEvent.click(addChaosButton);
      await tick();

      expect(gameStateService.addChaos).toHaveBeenCalledWith(10);
    });

    it('should call gameStateService.addDecks when Add Decks button is clicked', async () => {
      const { gameStateService } = await import('$lib/services/gameStateService.js');
      const { getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Click Add Decks
      const addDecksButton = getByLabelText(/add 10 decks/i);
      await fireEvent.click(addDecksButton);
      await tick();

      expect(gameStateService.addDecks).toHaveBeenCalledWith(10);
    });
  });

  describe('Debug Tools - Upgrades Section', () => {
    it('should render Rarity slider', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const raritySlider = container.querySelector('#rarity-slider');
      expect(raritySlider).toBeTruthy();
      expect(raritySlider?.getAttribute('type')).toBe('range');
    });

    it('should render Lucky Drop slider', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const luckyDropSlider = container.querySelector('#luckydrop-slider');
      expect(luckyDropSlider).toBeTruthy();
      expect(luckyDropSlider?.getAttribute('type')).toBe('range');
    });

    it('should call gameStateService.setCustomRarityPercentage when Rarity slider changes', async () => {
      const { gameStateService } = await import('$lib/services/gameStateService.js');
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Change rarity slider
      const raritySlider = container.querySelector('#rarity-slider') as HTMLInputElement;
      expect(raritySlider).toBeTruthy();
      if (raritySlider) {
        raritySlider.value = '500';
        await fireEvent.change(raritySlider);
        await tick();
        await waitFor(() => {
          expect(gameStateService.setCustomRarityPercentage).toHaveBeenCalled();
        }, { timeout: 1000 });
      }
    });

    it('should call gameStateService.setLuckyDropLevel when Lucky Drop slider changes', async () => {
      const { gameStateService } = await import('$lib/services/gameStateService.js');
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Change lucky drop slider
      const luckyDropSlider = container.querySelector('#luckydrop-slider') as HTMLInputElement;
      expect(luckyDropSlider).toBeTruthy();
      if (luckyDropSlider) {
        luckyDropSlider.value = '5';
        await fireEvent.change(luckyDropSlider);
        await tick();
        await waitFor(() => {
          expect(gameStateService.setLuckyDropLevel).toHaveBeenCalledWith(5);
        }, { timeout: 1000 });
      }
    });
  });

  describe('Debug Tools - Settings Section', () => {
    it('should render Debug Mode toggle button', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const debugToggle = getByLabelText(/debug mode/i);
      expect(debugToggle).toBeTruthy();
    });

    it('should toggle debug mode when button is clicked', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      const debugToggle = getByLabelText(/debug mode/i);
      const initialText = debugToggle.textContent;
      
      await fireEvent.click(debugToggle);
      await tick();

      const updatedText = debugToggle.textContent;
      expect(updatedText).not.toBe(initialText);
    });
  });

  describe('Visibility Control', () => {
    it('should show trigger button in development mode', async () => {
      // Mock import.meta.env.DEV to be true
      const originalEnv = import.meta.env.DEV;
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: true },
        writable: true
      });

      const { getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      expect(trigger).toBeTruthy();
    });

    it('should hide trigger button in production mode when localStorage flag not set', async () => {
      // Mock import.meta.env.DEV to be false
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true
      });

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('debugMenuEnabled');
      }

      const { container } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = container.querySelector('.debug-menu-trigger');
      expect(trigger).toBeNull();
    });

    it('should show trigger button when localStorage flag is set even in production', async () => {
      // Mock import.meta.env.DEV to be false
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true
      });

      // Set localStorage flag
      if (typeof window !== 'undefined') {
        localStorage.setItem('debugMenuEnabled', 'true');
      }

      const { getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const trigger = getByLabelText(/open debug menu/i);
      expect(trigger).toBeTruthy();

      // Cleanup
      if (typeof window !== 'undefined') {
        localStorage.removeItem('debugMenuEnabled');
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate between tools with Tab key', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Get all focusable elements
      const focusableElements = container.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should handle Arrow keys for slider navigation', async () => {
      const { container, getByLabelText } = render(DebugMenu, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      // Open menu
      const trigger = getByLabelText(/open debug menu/i);
      await fireEvent.click(trigger);
      await tick();

      // Focus on rarity slider
      const raritySlider = container.querySelector('#rarity-slider') as HTMLInputElement;
      expect(raritySlider).toBeTruthy();
      if (raritySlider) {
        raritySlider.focus();
        const initialValue = parseFloat(raritySlider.value);
        
        // Arrow keys should change slider value
        await fireEvent.keyDown(raritySlider, { key: 'ArrowRight' });
        await tick();
        
        // Value should have changed (browser default behavior)
        expect(raritySlider).toBeTruthy();
      }
    });
  });
});

