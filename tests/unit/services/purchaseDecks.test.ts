import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameStateService } from '../../../src/lib/services/gameStateService.js';
import { gameModeService } from '../../../src/lib/services/gameModeService.js';
import { InsufficientResourcesError } from '../../../src/lib/utils/errors.js';

// Mock gameModeService
vi.mock('../../../src/lib/services/gameModeService.js', () => ({
  gameModeService: {
    getCurrentMode: vi.fn()
  }
}));

describe('GameStateService - purchaseDecks', () => {
  beforeEach(async () => {
    await gameStateService.initialize();
    vi.clearAllMocks();
  });

  it('should purchase decks successfully in Ruthless mode', async () => {
    // Mock Ruthless mode
    vi.mocked(gameModeService.getCurrentMode).mockReturnValue({
      id: 'ruthless',
      name: 'Ruthless',
      description: 'Test',
      startingDecks: 5,
      startingChaos: 25,
      shopEnabled: false,
      allowedUpgrades: [],
      initialUpgradeLevels: new Map(),
      customRarityPercentage: undefined
    });

    const state = gameStateService.getGameState();
    const initialScore = state.score;
    const initialDecks = state.decks;

    // Set sufficient chaos
    await gameStateService.addChaos(20);
    
    await gameStateService.purchaseDecks(10, 1);

    const newState = gameStateService.getGameState();
    expect(newState.score).toBe(initialScore + 20 - 10);
    expect(newState.decks).toBe(initialDecks + 1);
  });

  it('should throw InsufficientResourcesError when chaos is insufficient', async () => {
    // Mock Ruthless mode
    vi.mocked(gameModeService.getCurrentMode).mockReturnValue({
      id: 'ruthless',
      name: 'Ruthless',
      description: 'Test',
      startingDecks: 5,
      startingChaos: 25,
      shopEnabled: false,
      allowedUpgrades: [],
      initialUpgradeLevels: new Map(),
      customRarityPercentage: undefined
    });

    const state = gameStateService.getGameState();
    // Ensure low chaos
    if (state.score > 5) {
      // Reset to low score
      await gameStateService.updateGameState((s) => ({ ...s, score: 5 }), true);
    }

    await expect(
      gameStateService.purchaseDecks(10, 1)
    ).rejects.toThrow(InsufficientResourcesError);
  });

  it('should throw error when not in Ruthless mode', async () => {
    // Mock Classic mode
    vi.mocked(gameModeService.getCurrentMode).mockReturnValue({
      id: 'classic',
      name: 'Classic',
      description: 'Test',
      startingDecks: 'unlimited',
      startingChaos: 0,
      shopEnabled: false,
      allowedUpgrades: [],
      initialUpgradeLevels: new Map(),
      customRarityPercentage: undefined
    });

    await expect(
      gameStateService.purchaseDecks(10, 1)
    ).rejects.toThrow('Deck purchases are only available in Ruthless mode');
  });

  it('should throw error for invalid cost or count', async () => {
    await expect(
      gameStateService.purchaseDecks(0, 1)
    ).rejects.toThrow('Cost and count must be positive');

    await expect(
      gameStateService.purchaseDecks(10, 0)
    ).rejects.toThrow('Cost and count must be positive');
  });
});

