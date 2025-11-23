import { describe, it, expect } from 'vitest';
import { Scene } from '../../../src/lib/canvas/scene.js';
import { createCardAnimation } from '../../../src/lib/canvas/cardAnimation.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';

describe('Click Detection Performance', () => {
  let scene: Scene;
  let mockCard: DivinationCard;

  beforeEach(() => {
    scene = new Scene();
    scene.loadBackgroundImage();
    scene.loadDropMask(800, 600);
    
    mockCard = {
      name: 'Test Card',
      weight: 100,
      value: 5.0,
      qualityTier: 'common'
    };
  });

  it('should complete click detection within 50ms', () => {
    // Create multiple cards
    const cards = [];
    for (let i = 0; i < 50; i++) {
      const animation = createCardAnimation(mockCard, 100 + i * 10, 100 + i * 10, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      cards.push(animation);
    }
    
    (scene as any).cards = cards;
    
    const startTime = performance.now();
    scene.getCardAtLabelPosition(150, 150);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within 50ms
    expect(duration).toBeLessThan(50);
  });

  it('should handle maximum cards (150) efficiently', () => {
    // Create 150 cards (maximum)
    const cards = [];
    for (let i = 0; i < 150; i++) {
      const animation = createCardAnimation(mockCard, 100 + (i % 20) * 30, 100 + Math.floor(i / 20) * 30, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      cards.push(animation);
    }
    
    (scene as any).cards = cards;
    
    const startTime = performance.now();
    scene.getCardAtLabelPosition(200, 200);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should still complete within 50ms even with max cards
    expect(duration).toBeLessThan(50);
  });
});

