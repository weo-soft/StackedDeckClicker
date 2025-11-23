import { describe, it, expect, beforeEach } from 'vitest';
import { Scene } from '../../../src/lib/canvas/scene.js';
import { createCardAnimation } from '../../../src/lib/canvas/cardAnimation.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';

describe('Scene - Click Detection', () => {
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

  describe('getCardAtLabelPosition', () => {
    it('should return null when cards array is empty', () => {
      const result = scene.getCardAtLabelPosition(100, 100);
      expect(result).toBeNull();
    });

    it('should return null when click is outside all labels', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      
      // Add card to scene (using private access for testing)
      (scene as any).cards = [animation];
      
      // Click far away from label
      const result = scene.getCardAtLabelPosition(500, 500);
      expect(result).toBeNull();
    });

    it('should return card when click is within label bounds', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      
      (scene as any).cards = [animation];
      
      // Click in center of label (label is at card.x + labelX - width/2, card.y + labelY)
      // Label X: 100 + 0 - 50 = 50, Label Y: 100 + (-30) = 70
      const labelX = 100 + 0 - 50; // 50
      const labelY = 100 + (-30); // 70
      const clickX = labelX + 50; // center of label
      const clickY = labelY + 13; // center of label
      
      const result = scene.getCardAtLabelPosition(clickX, clickY);
      expect(result).toBe(animation);
    });

    it('should return topmost card when labels overlap', () => {
      const card1 = createCardAnimation(mockCard, 100, 100, true);
      card1.labelX = 0;
      card1.labelY = -30;
      card1.labelWidth = 100;
      card1.labelHeight = 26;
      card1.labelAlpha = 1.0;
      
      const card2 = createCardAnimation({ ...mockCard, name: 'Card 2' }, 100, 100, true);
      card2.labelX = 0;
      card2.labelY = -30;
      card2.labelWidth = 100;
      card2.labelHeight = 26;
      card2.labelAlpha = 1.0;
      
      // Add cards - card2 is added last, so it's on top
      (scene as any).cards = [card1, card2];
      
      // Click in overlapping area
      const labelX = 100 + 0 - 50;
      const labelY = 100 + (-30);
      const clickX = labelX + 50;
      const clickY = labelY + 13;
      
      const result = scene.getCardAtLabelPosition(clickX, clickY);
      // Should return card2 (topmost/newest)
      expect(result).toBe(card2);
    });

    it('should skip cards with labelAlpha <= 0', () => {
      const fadedCard = createCardAnimation(mockCard, 100, 100, true);
      fadedCard.labelX = 0;
      fadedCard.labelY = -30;
      fadedCard.labelWidth = 100;
      fadedCard.labelHeight = 26;
      fadedCard.labelAlpha = 0; // Faded out
      
      const visibleCard = createCardAnimation({ ...mockCard, name: 'Visible Card' }, 200, 200, true);
      visibleCard.labelX = 0;
      visibleCard.labelY = -30;
      visibleCard.labelWidth = 100;
      visibleCard.labelHeight = 26;
      visibleCard.labelAlpha = 1.0;
      
      (scene as any).cards = [fadedCard, visibleCard];
      
      // Click on faded card's label position
      const fadedLabelX = 100 + 0 - 50;
      const fadedLabelY = 100 + (-30);
      const clickX = fadedLabelX + 50;
      const clickY = fadedLabelY + 13;
      
      const result = scene.getCardAtLabelPosition(clickX, clickY);
      // Should return null (faded card is skipped)
      expect(result).toBeNull();
      
      // Click on visible card's label
      const visibleLabelX = 200 + 0 - 50;
      const visibleLabelY = 200 + (-30);
      const clickX2 = visibleLabelX + 50;
      const clickY2 = visibleLabelY + 13;
      
      const result2 = scene.getCardAtLabelPosition(clickX2, clickY2);
      expect(result2).toBe(visibleCard);
    });

    it('should handle edge cases of label bounds correctly', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      
      (scene as any).cards = [animation];
      
      const labelX = 100 + 0 - 50; // 50
      const labelY = 100 + (-30); // 70
      
      // Test top-left corner (inclusive)
      expect(scene.getCardAtLabelPosition(labelX, labelY)).toBe(animation);
      
      // Test bottom-right corner (inclusive)
      expect(scene.getCardAtLabelPosition(labelX + 100, labelY + 26)).toBe(animation);
      
      // Test just outside bounds
      expect(scene.getCardAtLabelPosition(labelX - 1, labelY)).toBeNull();
      expect(scene.getCardAtLabelPosition(labelX, labelY - 1)).toBeNull();
      expect(scene.getCardAtLabelPosition(labelX + 100 + 1, labelY)).toBeNull();
      expect(scene.getCardAtLabelPosition(labelX, labelY + 26 + 1)).toBeNull();
    });
  });

  describe('hover state management', () => {
    it('should set and get hovered card', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      
      expect(scene.getHoveredCard()).toBeNull();
      
      scene.setHoveredCard(animation);
      expect(scene.getHoveredCard()).toBe(animation);
      
      scene.setHoveredCard(null);
      expect(scene.getHoveredCard()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid coordinates (NaN)', () => {
      expect(scene.getCardAtLabelPosition(NaN, 100)).toBeNull();
      expect(scene.getCardAtLabelPosition(100, NaN)).toBeNull();
      expect(scene.getCardAtLabelPosition(NaN, NaN)).toBeNull();
    });

    it('should handle invalid coordinates (non-number)', () => {
      expect(scene.getCardAtLabelPosition(null as any, 100)).toBeNull();
      expect(scene.getCardAtLabelPosition(100, undefined as any)).toBeNull();
    });

    it('should handle cards with invalid label dimensions', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 0; // Invalid
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      
      (scene as any).cards = [animation];
      
      const result = scene.getCardAtLabelPosition(100, 100);
      expect(result).toBeNull();
    });

    it('should handle cards with missing card data', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 1.0;
      (animation as any).card = null; // Invalid card
      
      (scene as any).cards = [animation];
      
      const result = scene.getCardAtLabelPosition(100, 100);
      expect(result).toBeNull();
    });

    it('should handle rapid successive clicks correctly', () => {
      const card1 = createCardAnimation(mockCard, 100, 100, true);
      card1.labelX = 0;
      card1.labelY = -30;
      card1.labelWidth = 100;
      card1.labelHeight = 26;
      card1.labelAlpha = 1.0;
      
      const card2 = createCardAnimation({ ...mockCard, name: 'Card 2' }, 200, 200, true);
      card2.labelX = 0;
      card2.labelY = -30;
      card2.labelWidth = 100;
      card2.labelHeight = 26;
      card2.labelAlpha = 1.0;
      
      (scene as any).cards = [card1, card2];
      
      // Rapid clicks on different positions
      const result1 = scene.getCardAtLabelPosition(100 + 0 - 50 + 50, 100 + (-30) + 13);
      const result2 = scene.getCardAtLabelPosition(200 + 0 - 50 + 50, 200 + (-30) + 13);
      const result3 = scene.getCardAtLabelPosition(100 + 0 - 50 + 50, 100 + (-30) + 13);
      
      expect(result1).toBe(card1);
      expect(result2).toBe(card2);
      expect(result3).toBe(card1);
    });

    it('should handle cards that are being removed', () => {
      const animation = createCardAnimation(mockCard, 100, 100, true);
      animation.labelX = 0;
      animation.labelY = -30;
      animation.labelWidth = 100;
      animation.labelHeight = 26;
      animation.labelAlpha = 0.5; // Partially faded but still clickable
      
      (scene as any).cards = [animation];
      
      // Should still be clickable if labelAlpha > 0
      const labelX = 100 + 0 - 50;
      const labelY = 100 + (-30);
      const result = scene.getCardAtLabelPosition(labelX + 50, labelY + 13);
      expect(result).toBe(animation);
      
      // But not if labelAlpha is 0
      animation.labelAlpha = 0;
      const result2 = scene.getCardAtLabelPosition(labelX + 50, labelY + 13);
      expect(result2).toBeNull();
    });
  });
});

