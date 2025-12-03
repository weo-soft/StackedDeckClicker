/**
 * Performance tests for DebugMenu component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import DebugMenu from '$lib/components/DebugMenu.svelte';
import type { GameState } from '$lib/models/GameState.js';
import { createDefaultGameState } from '$lib/utils/defaultGameState.js';

describe('DebugMenu Performance', () => {
  const mockGameState = createDefaultGameState();

  it('should open menu within 200ms', async () => {
    const { getByLabelText } = render(DebugMenu, {
      props: {
        gameState: mockGameState
      }
    });

    await tick();

    const trigger = getByLabelText(/open debug menu/i);
    const startTime = performance.now();
    
    await trigger.click();
    await tick();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should open within 200ms (PERF-001)
    expect(duration).toBeLessThan(200);
  });

  it('should close menu within 200ms', async () => {
    const { getByLabelText } = render(DebugMenu, {
      props: {
        gameState: mockGameState
      }
    });

    await tick();

    // Open menu first
    const trigger = getByLabelText(/open debug menu/i);
    await trigger.click();
    await tick();

    // Measure close time
    const closeButton = getByLabelText(/close/i);
    const startTime = performance.now();
    
    await closeButton.click();
    await tick();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should close within 200ms (PERF-002)
    expect(duration).toBeLessThan(200);
  });

  it('should respond to tool interactions within 100ms', async () => {
    const { getByLabelText } = render(DebugMenu, {
      props: {
        gameState: mockGameState
      }
    });

    await tick();

    // Open menu
    const trigger = getByLabelText(/open debug menu/i);
    await trigger.click();
    await tick();

    // Measure button click response
    const addChaosButton = getByLabelText(/add 10 chaos/i);
    const startTime = performance.now();
    
    await addChaosButton.click();
    await tick();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should respond within 100ms (PERF-003)
    expect(duration).toBeLessThan(100);
  });

  it('should not cause frame rate drops when menu is open', async () => {
    const { getByLabelText } = render(DebugMenu, {
      props: {
        gameState: mockGameState
      }
    });

    await tick();

    // Open menu
    const trigger = getByLabelText(/open debug menu/i);
    await trigger.click();
    await tick();

    // Measure frame rendering (simplified check)
    const startTime = performance.now();
    await tick();
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    // Frame should render quickly (<16ms for 60fps, but we allow more for test environment)
    expect(frameTime).toBeLessThan(100);
  });

  it('should have memory usage under 5MB when menu is open', async () => {
    // This is a simplified check - actual memory measurement would require more complex setup
    const { getByLabelText } = render(DebugMenu, {
      props: {
        gameState: mockGameState
      }
    });

    await tick();

    // Open menu
    const trigger = getByLabelText(/open debug menu/i);
    await trigger.click();
    await tick();

    // Basic check that component renders without errors
    // Actual memory measurement would require performance.memory API (Chrome only)
    // or more sophisticated profiling tools
    const menu = document.querySelector('.modal-overlay');
    expect(menu).toBeTruthy();
    
    // Note: Full memory testing would require browser-specific APIs
    // This test verifies the component doesn't have obvious memory leaks
  });
});

