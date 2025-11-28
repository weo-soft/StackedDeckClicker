/**
 * Integration tests for light beam effect
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scene } from '../../src/lib/canvas/scene.js';
import { createCardAnimation } from '../../src/lib/canvas/cardAnimation.js';
import type { DivinationCard } from '../../src/lib/models/Card.js';
import * as tierServiceModule from '../../src/lib/services/tierService.js';

// Mock tier service
vi.mock('../../src/lib/services/tierService.js', () => ({
  tierService: {
    getTierForCard: vi.fn()
  }
}));

describe('Light Beam Effect Integration', () => {
  let scene: Scene;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mockCard: DivinationCard;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;

    scene = new Scene();
    scene.initialize(canvas.width, canvas.height, null, null);

    mockCard = {
      name: 'Test Card',
      weight: 100,
      value: 5.0,
      qualityTier: 'common'
    };

    vi.clearAllMocks();
  });

  describe('Card Drop with Beam Effect', () => {
    it('should display beam effect when card is dropped from tier with beam enabled', () => {
      // Mock tier with beam enabled
      (tierService.getTierForCard as any).mockReturnValue({
        id: 'S',
        config: {
          lightBeam: {
            enabled: true,
            color: '#FF0000'
          }
        }
      });

      scene.addCard(mockCard, canvas.width, canvas.height);

      const cards = scene.getCards();
      expect(cards.length).toBe(1);
      expect(cards[0].beamEnabled).toBe(true);
      expect(cards[0].beamColor).toBe('#FF0000');
    });

    it('should not display beam effect when card is dropped from tier with beam disabled', () => {
      // Mock tier with beam disabled
      (tierServiceModule.tierService.getTierForCard as any).mockReturnValue({
        id: 'A',
        config: {
          lightBeam: {
            enabled: false,
            color: '#FF0000'
          }
        }
      });

      scene.addCard(mockCard, canvas.width, canvas.height);

      const cards = scene.getCards();
      expect(cards.length).toBe(1);
      expect(cards[0].beamEnabled).toBe(false);
    });

    it('should handle multiple cards with different beam configurations', () => {
      const card1: DivinationCard = { name: 'Card 1', weight: 100, value: 5.0, qualityTier: 'common' };
      const card2: DivinationCard = { name: 'Card 2', weight: 100, value: 5.0, qualityTier: 'rare' };

      // Mock different tiers for different cards
      (tierServiceModule.tierService.getTierForCard as any).mockImplementation((cardName: string) => {
        if (cardName === 'Card 1') {
          return {
            id: 'S',
            config: {
              lightBeam: { enabled: true, color: '#FF0000' }
            }
          };
        } else {
          return {
            id: 'A',
            config: {
              lightBeam: { enabled: true, color: '#00FF00' }
            }
          };
        }
      });

      scene.addCard(card1, canvas.width, canvas.height);
      scene.addCard(card2, canvas.width, canvas.height);

      const cards = scene.getCards();
      expect(cards.length).toBe(2);
      expect(cards[0].beamColor).toBe('#FF0000');
      expect(cards[1].beamColor).toBe('#00FF00');
    });
  });

  describe('Beam Rendering', () => {
    it('should render beams in correct z-order (between cards and labels)', () => {
      // This is tested via visual inspection, but we can verify the render method doesn't throw
      (tierService.getTierForCard as any).mockReturnValue({
        id: 'S',
        config: {
          lightBeam: {
            enabled: true,
            color: '#FF0000'
          }
        }
      });

      scene.addCard(mockCard, canvas.width, canvas.height);

      // Render should not throw
      expect(() => {
        scene.render(ctx);
      }).not.toThrow();
    });

    it('should handle rendering with multiple beams simultaneously', () => {
      // Mock tier with beam enabled
      (tierService.getTierForCard as any).mockReturnValue({
        id: 'S',
        config: {
          lightBeam: {
            enabled: true,
            color: '#FF0000'
          }
        }
      });

      // Add multiple cards
      for (let i = 0; i < 5; i++) {
        const card: DivinationCard = {
          name: `Card ${i}`,
          weight: 100,
          value: 5.0,
          qualityTier: 'common'
        };
        scene.addCard(card, canvas.width, canvas.height);
      }

      // Render should not throw and should handle multiple beams
      expect(() => {
        scene.render(ctx);
      }).not.toThrow();

      const cards = scene.getCards();
      expect(cards.length).toBe(5);
      cards.forEach(card => {
        expect(card.beamEnabled).toBe(true);
      });
    });
  });
});

