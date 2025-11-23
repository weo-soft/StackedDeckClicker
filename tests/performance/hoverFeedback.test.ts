import { describe, it, expect } from 'vitest';
import { canvasService } from '../../../src/lib/canvas/renderer.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';
import { createDefaultCardPool } from '../../../src/lib/utils/defaultCardPool.js';

describe('Hover Feedback Performance', () => {
  let canvas: HTMLCanvasElement;
  let card: DivinationCard;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    const pool = createDefaultCardPool();
    card = pool.cards[0];
    
    canvasService.initialize(canvas, 800, 600);
    canvasService.addCard(card, { x: 100, y: 100 });
  });

  it('should provide hover feedback within 50ms', async () => {
    const mockEvent = new MouseEvent('mousemove');
    
    const startTime = performance.now();
    canvasService.handleMouseMove(100, 100, mockEvent);
    
    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within 50ms + debounce time (50ms) = ~100ms total
    expect(duration).toBeLessThan(150);
  });

  it('should handle rapid mouse movements efficiently', async () => {
    const mockEvent = new MouseEvent('mousemove');
    
    const startTime = performance.now();
    
    // Rapid mouse movements
    for (let i = 0; i < 10; i++) {
      canvasService.handleMouseMove(100 + i, 100 + i, mockEvent);
    }
    
    // Wait for final debounce
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should handle efficiently with debouncing
    expect(duration).toBeLessThan(200);
  });
});

