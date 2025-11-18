/**
 * Custom error types for the game
 */

export class GameError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'GameError';
  }
}

export class StorageError extends GameError {
  constructor(message: string, code: string = 'STORAGE_ERROR') {
    super(message, code);
    this.name = 'StorageError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message, code);
    this.name = 'ValidationError';
  }
}

export class InsufficientResourcesError extends GameError {
  constructor(message: string, code: string = 'INSUFFICIENT_RESOURCES') {
    super(message, code);
    this.name = 'InsufficientResourcesError';
  }
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NO_DECKS: 'You have no decks available. Please wait for deck production or purchase upgrades.',
  INSUFFICIENT_SCORE: 'You do not have enough score to purchase this upgrade.',
  STORAGE_UNAVAILABLE: 'Unable to save game progress. Please check your browser storage settings.',
  STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded. Please clear some browser data.',
  CORRUPTED_DATA: 'Saved game data appears corrupted. Starting with a fresh game.',
  INVALID_UPGRADE: 'Invalid upgrade type selected.',
  CARD_POOL_EMPTY: 'Card pool is empty. This should not happen.'
} as const;

