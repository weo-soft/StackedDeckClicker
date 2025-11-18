/**
 * Available scene customization options.
 */
export interface Customization {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'background' | 'decoration' | 'effect';
  visualDescription: string;
}

/**
 * Default available customizations.
 */
export const AVAILABLE_CUSTOMIZATIONS: Customization[] = [
  {
    id: 'darkTheme',
    name: 'Dark Theme',
    description: 'A darker, more mysterious background',
    cost: 100,
    category: 'background',
    visualDescription: 'Dark blue-black gradient background'
  },
  {
    id: 'purpleTheme',
    name: 'Purple Theme',
    description: 'A mystical purple-themed background',
    cost: 250,
    category: 'background',
    visualDescription: 'Purple gradient background'
  },
  {
    id: 'goldTheme',
    name: 'Gold Theme',
    description: 'A luxurious gold-themed background',
    cost: 500,
    category: 'background',
    visualDescription: 'Gold gradient background'
  },
  {
    id: 'particleEffects',
    name: 'Particle Effects',
    description: 'Add subtle particle effects to the scene',
    cost: 300,
    category: 'effect',
    visualDescription: 'Floating particles in the background'
  },
  {
    id: 'glowBorder',
    name: 'Glowing Border',
    description: 'Add a glowing border around the canvas',
    cost: 200,
    category: 'decoration',
    visualDescription: 'Glowing border effect'
  }
];

/**
 * Get customization by ID.
 */
export function getCustomizationById(id: string): Customization | undefined {
  return AVAILABLE_CUSTOMIZATIONS.find((c) => c.id === id);
}

/**
 * Get all customizations by category.
 */
export function getCustomizationsByCategory(category: Customization['category']): Customization[] {
  return AVAILABLE_CUSTOMIZATIONS.filter((c) => c.category === category);
}

