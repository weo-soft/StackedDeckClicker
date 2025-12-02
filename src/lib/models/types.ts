/**
 * Base type definitions for the Stacked Deck Clicker game
 */

export type QualityTier = 'common' | 'rare' | 'epic' | 'legendary';

export type UpgradeType =
  | 'autoOpening' // Decks opened per second
  | 'improvedRarity' // Weight manipulation for rarer cards
  | 'luckyDrop' // Extra rolls, best-of-N selection (replaces 'luck')
  | 'multidraw' // Open 10/50/100 decks at once
  | 'deckProduction' // Passive deck generation rate
  | 'sceneCustomization'; // Cosmetic scene changes

