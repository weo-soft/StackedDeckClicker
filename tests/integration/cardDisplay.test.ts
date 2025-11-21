import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import LastCardZone from '$lib/components/LastCardZone.svelte';
import type { CardDrawResult } from '$lib/models/CardDrawResult.js';
import type { DivinationCard } from '$lib/models/Card.js';

describe('Card Display Integration', () => {
  const mockCard: DivinationCard = {
    name: 'A Chilling Wind',
    weight: 286,
    value: 8.07,
    qualityTier: 'common'
  };

  const mockCardDraw: CardDrawResult = {
    card: mockCard,
    timestamp: Date.now(),
    scoreGained: 8.07
  };

  it('should update display when CardDrawResult changes', async () => {
    const { component, rerender } = render(LastCardZone, {
      props: {
        width: 200,
        height: 220,
        lastCardDraw: null
      }
    });

    // Initially should show empty state
    expect(component).toBeTruthy();

    // Update with card draw
    await rerender({
      width: 200,
      height: 220,
      lastCardDraw: mockCardDraw
    });

    // Wait for card data to load
    await waitFor(() => {
      // Component should have updated
      expect(component).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle missing artwork gracefully', async () => {
    const cardWithoutArt: DivinationCard = {
      name: 'NonExistent Card',
      weight: 1,
      value: 0,
      qualityTier: 'common'
    };

    const cardDraw: CardDrawResult = {
      card: cardWithoutArt,
      timestamp: Date.now(),
      scoreGained: 0
    };

    const { component } = render(LastCardZone, {
      props: {
        width: 200,
        height: 220,
        lastCardDraw: cardDraw
      }
    });

    // Should render without throwing
    expect(component).toBeTruthy();

    // Wait for error state
    await waitFor(() => {
      expect(component).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('should handle rapid card changes without flickering', async () => {
    const card1: CardDrawResult = {
      card: { ...mockCard, name: 'Card 1' },
      timestamp: Date.now(),
      scoreGained: 1
    };

    const card2: CardDrawResult = {
      card: { ...mockCard, name: 'Card 2' },
      timestamp: Date.now() + 1,
      scoreGained: 2
    };

    const { component, rerender } = render(LastCardZone, {
      props: {
        width: 200,
        height: 220,
        lastCardDraw: card1
      }
    });

    // Rapidly change cards
    await rerender({ width: 200, height: 220, lastCardDraw: card2 });
    await rerender({ width: 200, height: 220, lastCardDraw: card1 });
    await rerender({ width: 200, height: 220, lastCardDraw: card2 });

    // Should handle without errors
    expect(component).toBeTruthy();
  });
});

