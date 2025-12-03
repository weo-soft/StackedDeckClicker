/**
 * Integration tests for DebugMenu - verifying tool migration and functionality preservation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import DebugMenu from '$lib/components/DebugMenu.svelte';
import InventoryZone from '$lib/components/InventoryZone.svelte';
import UpgradeShop from '$lib/components/UpgradeShop.svelte';
import { gameStateService } from '$lib/services/gameStateService.js';
import { upgradeService } from '$lib/services/upgradeService.js';
import type { GameState } from '$lib/models/GameState.js';
import { createDefaultGameState } from '$lib/utils/defaultGameState.js';
import { vi } from 'vitest';

// Mock upgradeService
vi.mock('$lib/services/upgradeService.js', () => {
  return {
    upgradeService: {
      getAvailableUpgrades: vi.fn(() => [])
    }
  };
});

describe('DebugMenu Integration - Tool Migration', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    mockGameState = createDefaultGameState();
    vi.clearAllMocks();
  });

  describe('Add Chaos Functionality Preservation', () => {
    it('should add chaos when Add Chaos button is clicked in debug menu', async () => {
      const addChaosSpy = vi.spyOn(gameStateService, 'addChaos').mockResolvedValue(undefined);
      
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

      await waitFor(() => {
        expect(addChaosSpy).toHaveBeenCalledWith(10);
      }, { timeout: 1000 });

      addChaosSpy.mockRestore();
    });
  });

  describe('Add Decks Functionality Preservation', () => {
    it('should add decks when Add Decks button is clicked in debug menu', async () => {
      const addDecksSpy = vi.spyOn(gameStateService, 'addDecks').mockResolvedValue(undefined);
      
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

      await waitFor(() => {
        expect(addDecksSpy).toHaveBeenCalledWith(10);
      }, { timeout: 1000 });

      addDecksSpy.mockRestore();
    });
  });

  describe('Rarity Slider Functionality Preservation', () => {
    it('should set custom rarity percentage when slider changes in debug menu', async () => {
      const setRaritySpy = vi.spyOn(gameStateService, 'setCustomRarityPercentage').mockResolvedValue(undefined);
      
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
        raritySlider.value = '2500';
        await fireEvent.change(raritySlider);
        await tick();
        
        await waitFor(() => {
          expect(setRaritySpy).toHaveBeenCalled();
        }, { timeout: 1000 });
      }

      setRaritySpy.mockRestore();
    });
  });

  describe('Lucky Drop Slider Functionality Preservation', () => {
    it('should set lucky drop level when slider changes in debug menu', async () => {
      const setLuckyDropSpy = vi.spyOn(gameStateService, 'setLuckyDropLevel').mockResolvedValue(undefined);
      
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
        luckyDropSlider.value = '7';
        await fireEvent.change(luckyDropSlider);
        await tick();
        
        await waitFor(() => {
          expect(setLuckyDropSpy).toHaveBeenCalledWith(7);
        }, { timeout: 1000 });
      }

      setLuckyDropSpy.mockRestore();
    });
  });

  describe('Debug Mode Toggle Functionality Preservation', () => {
    it('should toggle debug mode state when button is clicked in debug menu', async () => {
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

      const debugToggle = getByLabelText(/debug mode/i);
      const initialState = debugToggle.textContent?.includes('ON') || false;
      
      await fireEvent.click(debugToggle);
      await tick();

      const newState = debugToggle.textContent?.includes('ON') || false;
      expect(newState).toBe(!initialState);
    });
  });

  describe('Tools Removed from InventoryZone', () => {
    it('should not have Add Decks button in InventoryZone', async () => {
      const { container } = render(InventoryZone, {
        props: {
          width: 400,
          height: 300,
          gameState: mockGameState
        }
      });

      await tick();

      const addDecksButton = container.querySelector('.add-decks-button');
      expect(addDecksButton).toBeNull();
    });

    it('should not have Add Chaos button in InventoryZone', async () => {
      const { container } = render(InventoryZone, {
        props: {
          width: 400,
          height: 300,
          gameState: mockGameState
        }
      });

      await tick();

      const addChaosButton = container.querySelector('.add-chaos-button');
      expect(addChaosButton).toBeNull();
    });
  });

  describe('Tools Removed from UpgradeShop', () => {
    it('should not have rarity slider in UpgradeShop', async () => {
      const { container } = render(UpgradeShop, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const raritySlider = container.querySelector('#rarity-slider');
      expect(raritySlider).toBeNull();
    });

    it('should not have lucky drop slider in UpgradeShop', async () => {
      const { container } = render(UpgradeShop, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const luckyDropSlider = container.querySelector('#luckydrop-slider');
      expect(luckyDropSlider).toBeNull();
    });

    it('should not have debug mode toggle button in UpgradeShop', async () => {
      const { container } = render(UpgradeShop, {
        props: {
          gameState: mockGameState
        }
      });

      await tick();

      const debugToggle = container.querySelector('.debug-toggle-button');
      expect(debugToggle).toBeNull();
    });
  });
});

