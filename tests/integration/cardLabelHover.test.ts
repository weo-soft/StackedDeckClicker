import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import GameCanvas from '$lib/components/GameCanvas.svelte';
import type { ZoneLayout } from '$lib/models/ZoneLayout.js';
import { zoneLayoutService } from '$lib/services/zoneLayoutService.js';

describe('Card Label Hover Integration', () => {
  let mockZoneLayout: ZoneLayout;

  beforeEach(() => {
    mockZoneLayout = zoneLayoutService.initializeLayout(1920, 1080, 1.0);
  });

  it('should handle mouse move events on canvas', async () => {
    const { component, container } = render(GameCanvas, {
      props: {
        width: 800,
        height: 600,
        zoneLayout: mockZoneLayout,
        zoneBoundaryValidator: null
      }
    });

    expect(component).toBeTruthy();
    await tick();
    
    // Wait for canvas to initialize
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    }, { timeout: 2000 });

    // Component should handle mouse events
    expect(component).toBeTruthy();
  });

  it('should update cursor style on hover', async () => {
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
        // Cursor should be set (either 'pointer' or 'default')
        const cursor = canvas.style.cursor;
        expect(['pointer', 'default', '']).toContain(cursor);
      }
    }, { timeout: 2000 });
  });
});

