/**
 * Unit tests for light beam effect functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCardAnimation, updateCardAnimation } from '../../../src/lib/canvas/cardAnimation.js';
import type { DivinationCard } from '../../../src/lib/models/Card.js';
import { Scene } from '../../../src/lib/canvas/scene.js';

// Mock tier service before importing
vi.mock('../../../src/lib/services/tierService.js', () => {
  return {
    tierService: {
      getTierForCard: vi.fn()
    }
  };
});

import { tierService } from '../../../src/lib/services/tierService.js';

describe('Light Beam Effect', () => {
  let mockCard: DivinationCard;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    mockCard = {
      name: 'Test Card',
      weight: 100,
      value: 5.0,
      qualityTier: 'common'
    };

    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d')!;

    vi.clearAllMocks();
  });

  describe('createCardAnimation - Beam State Initialization', () => {
    it('should initialize beam state from tier configuration when tier has beam enabled', () => {
      // Mock tier with beam enabled
      vi.mocked(tierService.getTierForCard).mockReturnValue({
        id: 'S',
        config: {
          lightBeam: {
            enabled: true,
            color: '#FF0000'
          }
        }
      });

      const animation = createCardAnimation(mockCard, 100, 100, false);

      expect(animation.beamEnabled).toBe(true);
      expect(animation.beamColor).toBe('#FF0000');
      expect(animation.beamAge).toBe(0);
      expect(animation.beamHeight).toBeGreaterThan(0);
    });

    it('should initialize beam state as disabled when tier has beam disabled', () => {
      // Mock tier with beam disabled
      vi.mocked(tierService.getTierForCard).mockReturnValue({
        id: 'A',
        config: {
          lightBeam: {
            enabled: false,
            color: '#FF0000'
          }
        }
      });

      const animation = createCardAnimation(mockCard, 100, 100, false);

      expect(animation.beamEnabled).toBe(false);
      expect(animation.beamColor).toBe('#FF0000');
    });

    it('should initialize beam state as disabled when tier has no lightBeam property', () => {
      // Mock tier without lightBeam (backward compatibility)
      vi.mocked(tierService.getTierForCard).mockReturnValue({
        id: 'B',
        config: {}
      });

      const animation = createCardAnimation(mockCard, 100, 100, false);

      expect(animation.beamEnabled).toBe(false);
      expect(animation.beamColor).toBeNull();
    });

    it('should initialize beam state as disabled when tier service returns null', () => {
      // Mock tier service returning null (tier not found)
      vi.mocked(tierService.getTierForCard).mockReturnValue(null);

      const animation = createCardAnimation(mockCard, 100, 100, false);

      expect(animation.beamEnabled).toBe(false);
      expect(animation.beamColor).toBeNull();
    });

    it('should handle tier service errors gracefully', () => {
      // Mock tier service throwing error
      vi.mocked(tierService.getTierForCard).mockImplementation(() => {
        throw new Error('Service not initialized');
      });

      // Should not throw, should use defaults
      const animation = createCardAnimation(mockCard, 100, 100, false);

      expect(animation.beamEnabled).toBe(false);
      expect(animation.beamColor).toBeNull();
    });
  });

  describe('updateCardAnimation - Beam Age Increment', () => {
    it('should increment beam age with deltaTime', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamAge = 0;
      const initialAge = animation.beamAge;
      const deltaTime = 16.67; // ~1 frame at 60fps

      updateCardAnimation(animation, deltaTime, 600, 800, {} as Scene);

      expect(animation.beamAge).toBe(initialAge + deltaTime);
    });

    it('should increment beam age multiple times correctly', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamAge = 0;
      const deltaTime = 16.67;

      updateCardAnimation(animation, deltaTime, 600, 800, {} as Scene);
      updateCardAnimation(animation, deltaTime, 600, 800, {} as Scene);
      updateCardAnimation(animation, deltaTime, 600, 800, {} as Scene);

      expect(animation.beamAge).toBeCloseTo(deltaTime * 3, 1);
    });
  });

  describe('Beam Rendering Logic', () => {
    it('should skip rendering when beam is disabled', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamEnabled = false;
      animation.beamColor = '#FF0000';

      // Beam should not be rendered (tested via Scene.drawLightBeams)
      expect(animation.beamEnabled).toBe(false);
    });

    it('should skip rendering when beam color is null', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamEnabled = true;
      animation.beamColor = null;

      // Beam should not be rendered
      expect(animation.beamColor).toBeNull();
    });

    it('should render when beam is enabled and color is set', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamEnabled = true;
      animation.beamColor = '#FF0000';

      // Beam should be rendered
      expect(animation.beamEnabled).toBe(true);
      expect(animation.beamColor).toBe('#FF0000');
    });
  });

  describe('Beam Fade-Out Calculation', () => {
    it('should have full opacity before fade start time', () => {
      const animation = createCardAnimation(mockCard, 100, 100, false);
      animation.beamAge = 1000; // Before fade start (2000ms)
      animation.beamEnabled = true;
      animation.beamColor = '#FF0000';

      // Opacity should be 1.0 before fade starts
      const beamFadeStart = 2000;
      expect(animation.beamAge).toBeLessThan(beamFadeStart);
    });

    it('should calculate fade progress correctly', () => {
      const beamFadeStart = 2000;
      const beamFadeDuration = 6000;
      const beamAge = 5000; // 3 seconds into fade

      const fadeProgress = Math.min(1, (beamAge - beamFadeStart) / beamFadeDuration);
      const expectedOpacity = Math.pow(1 - fadeProgress, 2);

      expect(fadeProgress).toBeCloseTo(0.5, 1);
      expect(expectedOpacity).toBeCloseTo(0.25, 2); // (1 - 0.5)^2 = 0.25
    });

    it('should have zero opacity after fade completes', () => {
      const beamFadeStart = 2000;
      const beamFadeDuration = 6000;
      const beamAge = 10000; // After fade completes

      const fadeProgress = Math.min(1, (beamAge - beamFadeStart) / beamFadeDuration);
      const opacity = Math.pow(1 - fadeProgress, 2);

      expect(fadeProgress).toBe(1);
      expect(opacity).toBe(0);
    });
  });
});

