import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import GameModeSelection from '../../../src/lib/components/GameModeSelection.svelte';
import { gameModeService } from '../../../src/lib/services/gameModeService.js';

// Mock gameModeService
vi.mock('../../../src/lib/services/gameModeService.js', () => ({
  gameModeService: {
    getAvailableModes: vi.fn(() => [
      {
        id: 'classic',
        name: 'Classic',
        description: 'Unlimited Stacked Decks, no shop, no upgrades',
        startingDecks: 'unlimited',
        startingChaos: 0,
        shopEnabled: false,
        allowedUpgrades: [],
        initialUpgradeLevels: new Map(),
        customRarityPercentage: undefined
      },
      {
        id: 'ruthless',
        name: 'Ruthless',
        description: 'Limited Stacked Decks, low starting chaos',
        startingDecks: 5,
        startingChaos: 25,
        shopEnabled: false,
        allowedUpgrades: [],
        initialUpgradeLevels: new Map(),
        customRarityPercentage: undefined
      },
      {
        id: 'dopamine',
        name: 'Give me my Dopamine',
        description: 'High starting resources',
        startingDecks: 75,
        startingChaos: 750,
        shopEnabled: true,
        allowedUpgrades: ['improvedRarity', 'luckyDrop'],
        initialUpgradeLevels: new Map([['luckyDrop', 1]]),
        customRarityPercentage: 25
      },
      {
        id: 'stacked-deck-clicker',
        name: 'Stacked Deck Clicker',
        description: 'Limited decks, enabled shop',
        startingDecks: 10,
        startingChaos: 0,
        shopEnabled: true,
        allowedUpgrades: ['autoOpening', 'improvedRarity', 'luckyDrop'],
        initialUpgradeLevels: new Map(),
        customRarityPercentage: undefined
      }
    ]),
    setMode: vi.fn()
  }
}));

describe('GameModeSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component rendering', () => {
    it('should not render when isVisible is false', () => {
      const { container } = render(GameModeSelection, { isVisible: false });
      expect(container.querySelector('.modal-overlay')).toBeNull();
    });

    it('should render when isVisible is true', () => {
      const { container } = render(GameModeSelection, { isVisible: true });
      expect(container.querySelector('.modal-overlay')).toBeTruthy();
      expect(container.querySelector('#game-mode-title')).toBeTruthy();
    });

    it('should display all four game modes', () => {
      const { getByText } = render(GameModeSelection, { isVisible: true });
      expect(getByText('Classic')).toBeTruthy();
      expect(getByText('Ruthless')).toBeTruthy();
      expect(getByText('Give me my Dopamine')).toBeTruthy();
      expect(getByText('Stacked Deck Clicker')).toBeTruthy();
    });

    it('should display mode descriptions', () => {
      const { getByText } = render(GameModeSelection, { isVisible: true });
      expect(getByText(/Unlimited Stacked Decks/)).toBeTruthy();
      expect(getByText(/Limited Stacked Decks/)).toBeTruthy();
    });
  });

  describe('Mode selection interaction', () => {
    it('should select a mode when clicked', async () => {
      const { getByText, container } = render(GameModeSelection, { isVisible: true });
      const classicButton = getByText('Classic').closest('button');
      
      expect(classicButton).toBeTruthy();
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        // Check if selected
        await waitFor(() => {
          const selectedCard = container.querySelector('.mode-card.selected');
          expect(selectedCard).toBeTruthy();
        });
      }
    });

    it('should show confirmation actions when mode is selected', async () => {
      const { getByText, container } = render(GameModeSelection, { isVisible: true });
      const classicButton = getByText('Classic').closest('button');
      
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        await waitFor(() => {
          expect(getByText('Confirm Selection')).toBeTruthy();
          expect(getByText('Cancel')).toBeTruthy();
        });
      }
    });

    it('should dispatch mode:selected event when confirmed', async () => {
      const { component, getByText } = render(GameModeSelection, { isVisible: true });
      const handler = vi.fn();
      component.$on('mode:selected', handler);

      const classicButton = getByText('Classic').closest('button');
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        const confirmButton = getByText('Confirm Selection');
        await fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({ detail: { modeId: 'classic' } })
          );
        });
      }
    });

    it('should call gameModeService.setMode when confirmed', async () => {
      const { getByText } = render(GameModeSelection, { isVisible: true });
      const classicButton = getByText('Classic').closest('button');
      
      if (classicButton) {
        await fireEvent.click(classicButton);
        const confirmButton = getByText('Confirm Selection');
        await fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(gameModeService.setMode).toHaveBeenCalledWith('classic');
        });
      }
    });
  });

  describe('Keyboard navigation', () => {
    it('should handle Tab key navigation', async () => {
      const { container } = render(GameModeSelection, { isVisible: true });
      
      await waitFor(() => {
        const firstButton = container.querySelector('.mode-card button') as HTMLElement;
        expect(firstButton).toBeTruthy();
        if (firstButton) {
          firstButton.focus();
          expect(document.activeElement).toBe(firstButton);
        }
      });
    });

    it('should handle Arrow key navigation', async () => {
      const { container } = render(GameModeSelection, { isVisible: true });
      
      await waitFor(() => {
        const buttons = Array.from(container.querySelectorAll('.mode-card button')) as HTMLElement[];
        expect(buttons.length).toBeGreaterThan(0);
        
        if (buttons.length > 0) {
          buttons[0].focus();
          
          fireEvent.keyDown(container.querySelector('.modal-overlay')!, { key: 'ArrowRight' });
          
          // Should move to next button
          expect(document.activeElement).toBe(buttons[1] || buttons[0]);
        }
      });
    });

    it('should close on Escape key', async () => {
      const { component, container } = render(GameModeSelection, { isVisible: true });
      const handler = vi.fn();
      component.$on('mode:cancelled', handler);

      const overlay = container.querySelector('.modal-overlay');
      expect(overlay).toBeTruthy();
      
      if (overlay) {
        fireEvent.keyDown(overlay, { key: 'Escape' });
        
        await waitFor(() => {
          expect(handler).toHaveBeenCalled();
        });
      }
    });
  });

  describe('ARIA labels and accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(GameModeSelection, { isVisible: true });
      const overlay = container.querySelector('.modal-overlay');
      
      expect(overlay).toHaveAttribute('role', 'dialog');
      expect(overlay).toHaveAttribute('aria-modal', 'true');
      expect(overlay).toHaveAttribute('aria-labelledby', 'game-mode-title');
    });

    it('should have aria-pressed on selected mode button', async () => {
      const { getByText, container } = render(GameModeSelection, { isVisible: true });
      const classicButton = getByText('Classic').closest('button');
      
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        await waitFor(() => {
          expect(classicButton).toHaveAttribute('aria-pressed', 'true');
        });
      }
    });

    it('should have aria-label on mode buttons', () => {
      const { getByText } = render(GameModeSelection, { isVisible: true });
      const classicButton = getByText('Classic').closest('button');
      
      expect(classicButton).toHaveAttribute('aria-label', 'Select Classic mode');
    });
  });

  describe('Mode change confirmation', () => {
    it('should show confirmation dialog when isModeChange is true', async () => {
      const { getByText } = render(GameModeSelection, { 
        isVisible: true, 
        isModeChange: true 
      });
      
      const classicButton = getByText('Classic').closest('button');
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        await waitFor(() => {
          expect(getByText(/Changing game mode will reset/)).toBeTruthy();
          expect(getByText('Change Mode')).toBeTruthy();
        });
      }
    });

    it('should proceed directly when isModeChange is false', async () => {
      const { component, getByText } = render(GameModeSelection, { 
        isVisible: true, 
        isModeChange: false 
      });
      
      const handler = vi.fn();
      component.$on('mode:selected', handler);

      const classicButton = getByText('Classic').closest('button');
      if (classicButton) {
        await fireEvent.click(classicButton);
        
        // Should dispatch immediately without confirmation
        await waitFor(() => {
          expect(handler).toHaveBeenCalled();
        });
      }
    });
  });
});

