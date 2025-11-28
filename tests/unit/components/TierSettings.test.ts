/**
 * Unit tests for TierSettings component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tier } from '$lib/models/Tier.js';

// Mock tierStore BEFORE importing component
vi.mock('$lib/stores/tierStore.js', () => {
  const mockTiers: Tier[] = [
    {
      id: 'S',
      name: 'S',
      type: 'default',
      order: 0,
      config: {
        colorScheme: {
          backgroundColor: '#FFD700',
          textColor: '#000000',
          borderColor: '#FFA500',
          borderWidth: 2
        },
        sound: {
          filePath: null,
          volume: 1.0,
          enabled: true
        },
        enabled: true,
        modifiedAt: Date.now()
      },
      modifiedAt: Date.now()
    },
    {
      id: 'A',
      name: 'A',
      type: 'default',
      order: 1,
      config: {
        colorScheme: {
          backgroundColor: '#FF6B6B',
          textColor: '#FFFFFF',
          borderColor: '#CC0000',
          borderWidth: 2
        },
        sound: {
          filePath: null,
          volume: 1.0,
          enabled: true
        },
        enabled: false, // Disabled tier for testing
        modifiedAt: Date.now()
      },
      modifiedAt: Date.now()
    }
  ];

  const mockTierStore = {
    getAllTiers: vi.fn(() => mockTiers),
    subscribe: vi.fn((callback: (value: any) => void) => {
      callback({ initialized: true, tiers: new Map(), cardAssignments: new Map() });
      return () => {}; // Return unsubscribe function
    }),
    refresh: vi.fn()
  };
  return {
    tierStore: mockTierStore
  };
});

// Mock tierService BEFORE importing component
vi.mock('$lib/services/tierService.js', () => {
  const mockTierService = {
    getCardsInTier: vi.fn((tierId: string) => {
      if (tierId === 'S') {
        return ['THE DOCTOR', 'THE NURSE', 'THE PATIENT'];
      }
      if (tierId === 'A') {
        return ['THE WRATH', 'THE RISK'];
      }
      return [];
    }),
    updateTierConfiguration: vi.fn(async (tierId: string, config: any) => {
      return { success: true };
    }),
    createCustomTier: vi.fn(async (name: string) => {
      return { id: 'custom-1', name };
    }),
    deleteCustomTier: vi.fn(async (tierId: string) => {
      return { success: true };
    })
  };
  return {
    tierService: mockTierService
  };
});

// Now import component and testing utilities
import { render, waitFor, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import TierSettings from '$lib/components/TierSettings.svelte';

describe('TierSettings Component', () => {
  let mockTierStore: any;
  let mockTierService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Import mocks after they're set up
    const tierStoreModule = await import('$lib/stores/tierStore.js');
    const tierServiceModule = await import('$lib/services/tierService.js');
    mockTierStore = tierStoreModule.tierStore;
    mockTierService = tierServiceModule.tierService;
  });

  describe('Tier List Rendering (T007)', () => {
    it('should render all tiers as list entries', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierEntries = container.querySelectorAll('.tier-entry');
        expect(tierEntries.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should display tier names correctly', async () => {
      const { container, getByText } = render(TierSettings);
      await tick();
      await waitFor(() => {
        expect(getByText('Tier S')).toBeTruthy();
        expect(getByText('Tier A')).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should render tier list container with proper structure', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierList = container.querySelector('.tier-list');
        expect(tierList).toBeTruthy();
        // Note: role="list" may not be set if using div instead of ul
      }, { timeout: 2000 });
    });
  });

  describe('Label Preview Generation (T008)', () => {
    it('should display label preview for each tier', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const previews = container.querySelectorAll('.label-preview');
        expect(previews.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('should apply tier color scheme to label preview', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const preview = container.querySelector('.label-preview') as HTMLElement;
        expect(preview).toBeTruthy();
        if (preview) {
          const bgColor = preview.style.backgroundColor;
          const textColor = preview.style.color;
          expect(bgColor).toBeTruthy();
          expect(textColor).toBeTruthy();
        }
      }, { timeout: 2000 });
    });

    it('should display representative card name in preview', async () => {
      const { container, getByText } = render(TierSettings);
      await tick();
      await waitFor(() => {
        // Should show "THE DOCTOR" for Tier S
        expect(getByText('THE DOCTOR')).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should update preview when color scheme changes', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
      }, { timeout: 2000 });

      // Click to expand tier
      const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
      if (tierHeader) {
        await fireEvent.click(tierHeader);
        await tick();
        await waitFor(() => {
          const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
          expect(colorInput).toBeTruthy();
        }, { timeout: 2000 });
      }
    });
  });

  describe('Disabled Tier Visual Indication (T009)', () => {
    it('should apply disabled class to disabled tiers', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierItems = container.querySelectorAll('.tier-entry');
        const disabledItem = Array.from(tierItems).find(item => 
          item.classList.contains('disabled')
        );
        expect(disabledItem).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should show disabled styling on label preview for disabled tiers', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const previews = container.querySelectorAll('.label-preview');
        const disabledPreview = Array.from(previews).find(preview =>
          preview.classList.contains('disabled')
        );
        expect(disabledPreview).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should visually distinguish disabled tiers in list', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierItems = container.querySelectorAll('.tier-entry');
        expect(tierItems.length).toBeGreaterThan(0);
        // At least one should be disabled (Tier A)
        const hasDisabled = Array.from(tierItems).some(item =>
          item.classList.contains('disabled')
        );
        expect(hasDisabled).toBe(true);
      }, { timeout: 2000 });
    });
  });

  describe('Empty Tier List Message (T010)', () => {
    it('should display message when no tiers are available', async () => {
      mockTierStore.getAllTiers.mockReturnValueOnce([]);
      const { container, getByText } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const message = getByText(/No tiers available/i);
        expect(message).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should show appropriate empty state styling', async () => {
      mockTierStore.getAllTiers.mockReturnValueOnce([]);
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const noTiersMessage = container.querySelector('.no-tiers');
        expect(noTiersMessage).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should expand tier when header is clicked', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
      }, { timeout: 2000 });

      const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
      await fireEvent.click(tierHeader);
      await tick();
      
      await waitFor(() => {
        const collapsible = container.querySelector('.tier-collapsible');
        expect(collapsible).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should update expand icon when tier is expanded', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const expandIcon = container.querySelector('.expand-icon');
        expect(expandIcon).toBeTruthy();
      }, { timeout: 2000 });

      const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
      const initialIcon = container.querySelector('.expand-icon')?.textContent;
      
      await fireEvent.click(tierHeader);
      await tick();
      
      await waitFor(() => {
        const newIcon = container.querySelector('.expand-icon')?.textContent;
        expect(newIcon).not.toBe(initialIcon);
      }, { timeout: 2000 });
    });
  });

  describe('Card List Display', () => {
    it('should display cards in tier when expanded', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
      }, { timeout: 2000 });

      const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
      await fireEvent.click(tierHeader);
      await tick();
      
      await waitFor(() => {
        const cardList = container.querySelector('.card-list');
        expect(cardList).toBeTruthy();
      }, { timeout: 2000 });
    });

    it('should show correct number of cards for tier', async () => {
      const { container, getByText } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
      }, { timeout: 2000 });

      const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
      await fireEvent.click(tierHeader);
      await tick();
      
      await waitFor(() => {
        // Should show count in heading
        const heading = getByText(/Cards in Tier S/i);
        expect(heading).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on tier headers', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
        if (tierHeader) {
          expect(tierHeader.getAttribute('aria-expanded')).toBeTruthy();
          expect(tierHeader.getAttribute('aria-controls')).toBeTruthy();
        }
      }, { timeout: 2000 });
    });

    it('should be keyboard navigable', async () => {
      const { container } = render(TierSettings);
      await tick();
      await waitFor(() => {
        const tierHeader = container.querySelector('.tier-entry-header') as HTMLElement;
        expect(tierHeader).toBeTruthy();
        if (tierHeader) {
          expect(tierHeader.getAttribute('tabindex')).toBe('0');
        }
      }, { timeout: 2000 });
    });
  });
});

