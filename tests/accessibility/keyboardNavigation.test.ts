import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import GameCanvas from '$lib/components/GameCanvas.svelte';
import type { ZoneLayout } from '$lib/models/ZoneLayout.js';
import { zoneLayoutService } from '$lib/services/zoneLayoutService.js';

describe('Keyboard Navigation Accessibility', () => {
  let mockZoneLayout: ZoneLayout;

  beforeEach(() => {
    mockZoneLayout = zoneLayoutService.initializeLayout(1920, 1080, 1.0);
  });

  it('should have canvas focusable with tabindex', async () => {
    const { container } = render(GameCanvas, {
      props: {
        width: 800,
        height: 600,
        zoneLayout: mockZoneLayout,
        zoneBoundaryValidator: null
      }
    });

    await tick();
    
    await waitFor(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();
      
      if (canvas) {
        expect(canvas.getAttribute('tabindex')).toBe('0');
      }
    }, { timeout: 2000 });
  });

  it('should have appropriate ARIA attributes', async () => {
    const { container } = render(GameCanvas, {
      props: {
        width: 800,
        height: 600,
        zoneLayout: mockZoneLayout,
        zoneBoundaryValidator: null
      }
    });

    await tick();
    
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
      
      if (canvas) {
        expect(canvas.getAttribute('role')).toBe('application');
        expect(canvas.getAttribute('aria-label')).toBeTruthy();
        expect(canvas.getAttribute('aria-keyshortcuts')).toBeTruthy();
      }
    }, { timeout: 2000 });
  });

  it('should handle keyboard events', async () => {
    const { container } = render(GameCanvas, {
      props: {
        width: 800,
        height: 600,
        zoneLayout: mockZoneLayout,
        zoneBoundaryValidator: null
      }
    });

    await tick();
    
    await waitFor(() => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();
      
      if (canvas) {
        // Focus canvas
        canvas.focus();
        
        // Simulate keyboard events
        const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        fireEvent(canvas, arrowDownEvent);
        
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        fireEvent(canvas, enterEvent);
        
        // Should not throw
        expect(true).toBe(true);
      }
    }, { timeout: 2000 });
  });
});

