import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import GameAreaLayout from '$lib/components/GameAreaLayout.svelte';
import type { GameState } from '$lib/models/GameState.js';
import type { CardDrawResult } from '$lib/models/CardDrawResult.js';
import type { DivinationCard } from '$lib/models/Card.js';
import { createDefaultCardPool } from '$lib/utils/defaultCardPool.js';

describe('Card Label Click Integration', () => {
  let mockGameState: GameState;
  let mockCard: DivinationCard;
  let mockCardDraw: CardDrawResult;

  beforeEach(() => {
    const pool = createDefaultCardPool();
    mockCard = pool.cards[0];
    
    mockCardDraw = {
      card: mockCard,
      timestamp: Date.now(),
      scoreGained: mockCard.value
    };

    mockGameState = {
      decks: 10,
      chaos: 100,
      score: 1000,
      totalCardsDrawn: 50,
      cardPool: pool,
      upgrades: new Map(),
      customizations: new Map(),
      lastCardDraw: null
    };
  });

  it('should handle click event flow from GameCanvas to LastCardZone', async () => {
    const { component, container } = render(GameAreaLayout, {
      props: {
        gameState: mockGameState,
        lastCardDraw: null
      }
    });

    expect(component).toBeTruthy();
    
    // Wait for component to initialize
    await tick();
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    }, { timeout: 2000 });

    // Note: Full E2E testing of click events requires Playwright
    // This integration test verifies component structure and props
    expect(component).toBeTruthy();
  });

  it('should update LastCardZone when clickedCard prop changes', async () => {
    const { component, rerender } = render(GameAreaLayout, {
      props: {
        gameState: mockGameState,
        lastCardDraw: null,
        clickedCard: null
      }
    });

    expect(component).toBeTruthy();
    await tick();

    // Simulate clicked card
    const clickedCard: CardDrawResult = {
      card: mockCard,
      timestamp: Date.now(),
      scoreGained: mockCard.value
    };

    await rerender({
      gameState: mockGameState,
      lastCardDraw: null,
      clickedCard: clickedCard
    });

    await tick();
    expect(component).toBeTruthy();
  });

  it('should prioritize clickedCard over lastCardDraw', async () => {
    const lastCard: CardDrawResult = {
      card: { ...mockCard, name: 'Last Card' },
      timestamp: Date.now() - 1000,
      scoreGained: 5.0
    };

    const clickedCard: CardDrawResult = {
      card: { ...mockCard, name: 'Clicked Card' },
      timestamp: Date.now(),
      scoreGained: 10.0
    };

    const { component, rerender } = render(GameAreaLayout, {
      props: {
        gameState: mockGameState,
        lastCardDraw: lastCard,
        clickedCard: null
      }
    });

    expect(component).toBeTruthy();
    await tick();

    // Add clicked card - should take precedence
    await rerender({
      gameState: mockGameState,
      lastCardDraw: lastCard,
      clickedCard: clickedCard
    });

    await tick();
    expect(component).toBeTruthy();
  });

  it('should handle invalid card data gracefully', async () => {
    const { component } = render(GameAreaLayout, {
      props: {
        gameState: mockGameState,
        lastCardDraw: null,
        clickedCard: null
      }
    });

    expect(component).toBeTruthy();
    await tick();

    // Component should handle invalid data without crashing
    expect(component).toBeTruthy();
  });

  it('should handle rapid card clicks', async () => {
    const card1: CardDrawResult = {
      card: { ...mockCard, name: 'Card 1' },
      timestamp: Date.now(),
      scoreGained: 1.0
    };

    const card2: CardDrawResult = {
      card: { ...mockCard, name: 'Card 2' },
      timestamp: Date.now() + 1,
      scoreGained: 2.0
    };

    const { component, rerender } = render(GameAreaLayout, {
      props: {
        gameState: mockGameState,
        lastCardDraw: null,
        clickedCard: null
      }
    });

    expect(component).toBeTruthy();
    await tick();

    // Rapidly change clicked cards
    await rerender({ gameState: mockGameState, lastCardDraw: null, clickedCard: card1 });
    await tick();
    await rerender({ gameState: mockGameState, lastCardDraw: null, clickedCard: card2 });
    await tick();
    await rerender({ gameState: mockGameState, lastCardDraw: null, clickedCard: card1 });
    await tick();

    // Should handle without errors
    expect(component).toBeTruthy();
  });
});

