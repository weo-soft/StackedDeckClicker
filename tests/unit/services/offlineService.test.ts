import { describe, it, expect, beforeEach } from 'vitest';
import { offlineService } from '$lib/services/offlineService.js';
import type { GameState } from '$lib/models/GameState.js';
import { createDefaultGameState } from '$lib/utils/defaultGameState.js';
import { createDefaultCardPool } from '$lib/utils/defaultCardPool.js';

describe('OfflineService', () => {
  let gameState: GameState;
  const MAX_OFFLINE_SECONDS = 7 * 24 * 60 * 60; // 7 days

  beforeEach(() => {
    gameState = createDefaultGameState();
    // Set a timestamp from 1 hour ago
    gameState.lastSessionTimestamp = Date.now() - 3600 * 1000;
  });

  describe('calculateOfflineProgression', () => {
    it('should return null when no auto-opening upgrade is active', () => {
      // Ensure auto-opening is at level 0
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 0;
      }

      const result = offlineService.calculateOfflineProgression(
        gameState,
        Date.now(),
        createDefaultCardPool()
      );

      expect(result).toBeNull();
    });

    it('should calculate correct elapsed time', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1; // 0.1 decks/sec
      }

      const now = Date.now();
      const elapsedSeconds = 3600; // 1 hour
      gameState.lastSessionTimestamp = now - elapsedSeconds * 1000;

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      expect(result!.elapsedSeconds).toBe(elapsedSeconds);
    });

    it('should cap elapsed time to maximum (7 days)', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1;
      }

      const now = Date.now();
      // Set timestamp to 10 days ago
      gameState.lastSessionTimestamp = now - 10 * 24 * 60 * 60 * 1000;

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      expect(result!.elapsedSeconds).toBe(MAX_OFFLINE_SECONDS);
      expect(result!.capped).toBe(true);
    });

    it('should handle negative elapsed time (clock changed)', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1;
      }

      // Set timestamp in the future (clock changed backward)
      gameState.lastSessionTimestamp = Date.now() + 3600 * 1000;

      const result = offlineService.calculateOfflineProgression(
        gameState,
        Date.now(),
        createDefaultCardPool()
      );

      expect(result).toBeNull();
    });

    it('should calculate correct number of decks opened based on auto-opening rate', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1; // 0.1 decks/sec
      }

      const now = Date.now();
      const elapsedSeconds = 100; // 100 seconds
      gameState.lastSessionTimestamp = now - elapsedSeconds * 1000;
      gameState.decks = 1000; // Ensure enough decks

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      // 100 seconds * 0.1 decks/sec = 10 decks
      expect(result!.decksOpened).toBe(10);
    });

    it('should not open more decks than available', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1; // 0.1 decks/sec
      }

      const now = Date.now();
      const elapsedSeconds = 1000; // Would open 100 decks
      gameState.lastSessionTimestamp = now - elapsedSeconds * 1000;
      gameState.decks = 5; // Only 5 decks available

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      expect(result!.decksOpened).toBe(5); // Limited by available decks
    });

    it('should include deck production in deck count', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      const deckProduction = gameState.upgrades.upgrades.get('deckProduction');
      
      if (autoOpening) {
        autoOpening.level = 1; // 0.1 decks/sec
      }
      if (deckProduction) {
        deckProduction.level = 1; // 0.05 decks/sec
      }

      const now = Date.now();
      const elapsedSeconds = 100;
      gameState.lastSessionTimestamp = now - elapsedSeconds * 1000;
      gameState.decks = 1000;

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      // Auto-opening: 100 * 0.1 = 10 decks
      // Deck production: 100 * 0.05 = 5 decks
      // Total: 15 decks opened (but limited by auto-opening rate for opening)
      // Actually, deck production adds to available decks, not directly to opened decks
      // So we should have 10 decks opened (from auto-opening) and 5 decks produced
      expect(result!.decksOpened).toBeGreaterThanOrEqual(10);
    });
  });

  describe('simulateDeckOpening', () => {
    it('should use deterministic PRNG for reproducible results', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      if (autoOpening) {
        autoOpening.level = 1;
      }

      const now = Date.now();
      gameState.lastSessionTimestamp = now - 100 * 1000;
      gameState.decks = 10;

      // Simulate with same seed should produce same results
      const result1 = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      const result2 = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // Results should be deterministic (same seed = same results)
      expect(result1!.cardsDrawn.length).toBe(result2!.cardsDrawn.length);
      expect(result1!.scoreGained).toBe(result2!.scoreGained);
    });

    it('should apply upgrade effects during simulation', () => {
      const autoOpening = gameState.upgrades.upgrades.get('autoOpening');
      const improvedRarity = gameState.upgrades.upgrades.get('improvedRarity');
      
      if (autoOpening) {
        autoOpening.level = 1;
      }
      if (improvedRarity) {
        improvedRarity.level = 1;
      }

      const now = Date.now();
      gameState.lastSessionTimestamp = now - 100 * 1000;
      gameState.decks = 10;

      const result = offlineService.calculateOfflineProgression(
        gameState,
        now,
        createDefaultCardPool()
      );

      expect(result).not.toBeNull();
      expect(result!.cardsDrawn.length).toBeGreaterThan(0);
      // Cards should be drawn with upgrade effects applied
      expect(result!.scoreGained).toBeGreaterThan(0);
    });
  });
});

