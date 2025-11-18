import { writable } from 'svelte/store';
import type { GameState } from '../models/GameState.js';

/**
 * Svelte store for game state management.
 * Integrated with GameStateService for reactive updates.
 */
export const gameState = writable<GameState | null>(null);

