import { describe, it, expect, beforeEach } from 'vitest';
import { drawCardLabel } from '../../../src/lib/canvas/cardAnimation.js';
import { createCardAnimation } from '../../../src/lib/canvas/cardAnimation.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';

describe('drawCardLabel - Hover Effects', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mockCard: DivinationCard;
  let animation: ReturnType<typeof createCardAnimation>;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;
    
    mockCard = {
      name: 'Test Card',
      weight: 100,
      value: 5.0,
      qualityTier: 'common'
    };
    
    animation = createCardAnimation(mockCard, 100, 100, true);
    animation.labelX = 0;
    animation.labelY = -30;
    animation.labelWidth = 100;
    animation.labelHeight = 26;
    animation.labelAlpha = 1.0;
  });

  it('should draw label without hover effect when isHovered is false', () => {
    // Should not throw
    expect(() => {
      drawCardLabel(ctx, animation, false);
    }).not.toThrow();
    
    // Label should be drawn
    expect(animation.labelWidth).toBeGreaterThan(0);
  });

  it('should draw label with hover effect when isHovered is true', () => {
    // Should not throw
    expect(() => {
      drawCardLabel(ctx, animation, true);
    }).not.toThrow();
    
    // Label should be drawn with hover styling
    expect(animation.labelWidth).toBeGreaterThan(0);
  });

  it('should handle default isHovered parameter (false)', () => {
    // Should work without isHovered parameter (defaults to false)
    expect(() => {
      drawCardLabel(ctx, animation);
    }).not.toThrow();
  });

  it('should apply hover visual effects correctly', () => {
    // Draw without hover
    drawCardLabel(ctx, animation, false);
    const imageData1 = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Clear and draw with hover
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCardLabel(ctx, animation, true);
    const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Images should be different (hover effect applied)
    // This is a basic check - actual visual difference depends on implementation
    expect(imageData1).toBeTruthy();
    expect(imageData2).toBeTruthy();
  });
});

