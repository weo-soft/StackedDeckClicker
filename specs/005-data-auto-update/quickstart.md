# Quickstart Guide: Data Auto-Update System

**Feature**: 005-data-auto-update  
**Created**: 2025-01-27  
**Purpose**: Integration guide for connecting data update system to existing card loading infrastructure

## Overview

This feature adds automatic data fetching and update capabilities for divination card data from https://data.poeatlas.app/. The system integrates with existing card loading code (`CardDataService`, `defaultCardPool.ts`) to provide seamless data updates.

## Prerequisites

- Existing codebase with `CardDataService` and `defaultCardPool.ts`
- TypeScript 5.3, Svelte 4.2, SvelteKit 2.0
- Network access to https://data.poeatlas.app/ (for remote data)
- Local fallback files in `static/cards/` (cards.json, cardValues.json)

## Integration Steps

### Step 1: Create Data Fetcher Utility

Create `src/lib/utils/dataFetcher.ts` based on `example_files/data-fetcher.ts`:

```typescript
// Adapt the example implementation to match project structure
// Key changes:
// - Update import paths to match SvelteKit conventions
// - Ensure TypeScript types match existing models
// - Keep all core logic (caching, metadata checking, fallback)
```

### Step 2: Create Data Update Service

Create `src/lib/services/dataUpdateService.ts`:

```typescript
import { fetchDataWithFallback, checkForNewData, forceRefreshData, getCacheInfo } from '$lib/utils/dataFetcher'

export class DataUpdateService {
  private updateIntervalId: number | null = null
  
  async fetchDataWithFallback<T>(fileName: string, localImport: () => Promise<{ default: T }>): Promise<T> {
    return await fetchDataWithFallback(fileName, localImport)
  }
  
  // ... implement other methods
}

export const dataUpdateService = new DataUpdateService()
```

### Step 3: Update Card Data Loading

Modify `src/lib/utils/defaultCardPool.ts`:

```typescript
import { dataUpdateService } from '$lib/services/dataUpdateService'

export async function createDefaultCardPool(): Promise<CardPool> {
  try {
    // Replace existing fetch calls with dataUpdateService
    const cardsData = await dataUpdateService.fetchDataWithFallback(
      'divinationCardDetails.json',
      () => import('$static/cards/cards.json')
    )
    
    const valuesData = await dataUpdateService.fetchDataWithFallback(
      'divinationCardPrices.json',
      () => import('$static/cards/cardValues.json')
    )
    
    // ... rest of existing logic
  } catch (error) {
    // Existing error handling
  }
}
```

Modify `src/lib/services/cardDataService.ts`:

```typescript
import { dataUpdateService } from '$lib/services/dataUpdateService'

export class CardDataService {
  async loadCardsData(): Promise<FullCardData[]> {
    if (cardsDataCache) {
      return cardsDataCache
    }

    try {
      const data = await dataUpdateService.fetchDataWithFallback(
        'divinationCardDetails.json',
        () => import('$static/cards/cards.json')
      )
      cardsDataCache = data as FullCardData[]
      return cardsDataCache
    } catch (error) {
      console.error('Failed to load cards data:', error)
      return []
    }
  }
}
```

### Step 4: Create Data Version Store

Create `src/lib/stores/dataVersionStore.ts`:

```typescript
import { writable, derived } from 'svelte/store'
import type { UpdateStatus, DataVersionInfo } from '$lib/models/DataVersion'

export const dataVersionStore = writable<Record<string, UpdateStatus>>({})

// Helper functions for accessing store
export function getUpdateStatus(fileName: string): UpdateStatus | null {
  let status: UpdateStatus | null = null
  dataVersionStore.subscribe(store => {
    status = store[fileName] || null
  })()
  return status
}

// Derived store for formatted version info
export const versionInfoStore = derived(dataVersionStore, ($store) => {
  // Transform UpdateStatus to DataVersionInfo for display
})
```

### Step 5: Create Data Version Overlay Component

Create `src/lib/components/DataVersionOverlay.svelte`:

```svelte
<script lang="ts">
  import { dataVersionStore } from '$lib/stores/dataVersionStore'
  import { dataUpdateService } from '$lib/services/dataUpdateService'
  
  export let isOpen = false
  
  const dataFiles = [
    { name: 'divinationCardDetails.json', displayName: 'Divination Card Details' },
    { name: 'divinationCardPrices.json', displayName: 'Divination Card Prices' },
  ]
  
  async function checkForUpdates() {
    await dataUpdateService.checkAllForUpdates()
  }
  
  async function forceRefreshAll() {
    await dataUpdateService.forceRefreshAll()
    // Reload card data if needed
  }
</script>

<!-- Modal overlay with table showing file status -->
<!-- Adapt from example_files/AboutOverlay.vue patterns -->
```

### Step 6: Add UI Trigger

Add button to main page (`src/routes/+page.svelte`):

```svelte
<script lang="ts">
  import DataVersionOverlay from '$lib/components/DataVersionOverlay.svelte'
  
  let showDataVersion = false
</script>

<!-- Add button similar to Tier Settings button -->
<button on:click={() => showDataVersion = true}>
  Data Version
</button>

<DataVersionOverlay bind:isOpen={showDataVersion} />
```

### Step 7: Start Automatic Updates

Initialize automatic updates in `src/lib/services/gameStateService.ts`:

```typescript
import { dataUpdateService } from '$lib/services/dataUpdateService'

export class GameStateService {
  async initialize(): Promise<void> {
    // ... existing initialization
    
    // Start automatic background updates (1 hour interval)
    dataUpdateService.startAutomaticUpdates(60 * 60 * 1000)
  }
}
```

## File Mapping

Map remote file names to local files:

| Remote File | Local File | Internal Type |
|------------|-----------|---------------|
| `divinationCardDetails.json` | `static/cards/cards.json` | `CardData[]` |
| `divinationCardPrices.json` | `static/cards/cardValues.json` | `CardValueData[]` |
| `metadata.json` | N/A | Used for update checking only |

## Testing the Integration

### Manual Testing

1. **Initial Load**:
   - Start application
   - Verify data loads from remote or cache
   - Check console for fetch logs

2. **Update Check**:
   - Open Data Version overlay
   - Click "Check for Updates"
   - Verify status updates correctly

3. **Manual Refresh**:
   - Click "Refresh Data"
   - Verify data reloads
   - Verify UI updates with new data

4. **Offline Testing**:
   - Disable network
   - Verify fallback to cached data
   - Verify fallback to local files if no cache

### Automated Testing

Run test suite:

```bash
npm test
```

Key test scenarios:
- Data fetching with cache hit
- Data fetching with cache miss
- Network failure fallback
- Update checking
- Manual refresh

## Configuration

### Update Intervals

Default: 1 hour automatic checks

To change:

```typescript
dataUpdateService.startAutomaticUpdates(30 * 60 * 1000)  // 30 minutes
```

### Cache Expiration

Default: 1 hour cache expiration

To change (in `dataFetcher.ts`):

```typescript
const CACHE_EXPIRATION_MS = 30 * 60 * 1000  // 30 minutes
```

## Troubleshooting

### Data Not Updating

- Check network connectivity to https://data.poeatlas.app/
- Verify metadata.json is accessible
- Check browser console for errors
- Verify cache expiration settings

### Fallback Not Working

- Verify local files exist in `static/cards/`
- Check file names match mapping table
- Verify import paths are correct

### Performance Issues

- Check cache expiration is not too short
- Verify background checks are not blocking UI
- Monitor network requests in DevTools

## Next Steps

After integration:

1. Monitor data update frequency
2. Adjust cache expiration if needed
3. Add IndexedDB persistence (optional enhancement)
4. Add user preferences for update intervals (optional)

## References

- Example implementation: `example_files/data-fetcher.ts`
- Example UI: `example_files/AboutOverlay.vue`
- Service contract: `contracts/service-interfaces.md`
- Data model: `data-model.md`

