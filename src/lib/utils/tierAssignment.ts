import type { DivinationCard } from '../models/Card.js';
import type { DefaultTier, Tier, TierConfiguration, ColorScheme } from '../models/Tier.js';

/**
 * List of cards that should be assigned to S tier by default, regardless of value.
 */
const S_TIER_CARDS = new Set([
  'Broken Promises',
  'Brother\'s Gift',
  'Choking Guilt',
  'Damnation',
  'Desecrated Virtue',
  'Divine Beauty',
  'Divine Justice',
  'Father\'s Love',
  'Fire Of Unknown Origin',
  'History',
  'House of Mirrors',
  'I See Brothers',
  'Imperfect Memories',
  'Last Stand',
  'Love Through Ice',
  'Luminous Trove',
  'Monochrome',
  'One Last Score',
  'Seven Years Bad Luck',
  'Squandered Prosperity',
  'The Apothecary',
  'The Cheater',
  'The Demon',
  'The Doctor',
  'The Dragon\'s Heart',
  'The Endless Darkness',
  'The Eye of Terror',
  'The Fiend',
  'The Immortal',
  'The Insane Cat',
  'The Lake',
  'The Nurse',
  'The Obscured',
  'The Price of Devotion',
  'The Progeny of Lunaris',
  'The Rabbit\'s Foot',
  'The Samurai\'s Eye',
  'The Sephirot',
  'Unrequited Love',
  'Wealth and Power'
]);

/**
 * List of cards that should be assigned to A tier by default, regardless of value.
 */
const A_TIER_CARDS = new Set([
  'A Modest Request',
  'A Stone Perfected',
  'Assassin\'s Gift',
  'Auspicious Ambitions',
  'Avian Pursuit',
  'Brother\'s Stash',
  'Darker Half',
  'Doryani\'s Epiphany',
  'Duality',
  'Fateful Meeting',
  'Friendship',
  'Gemcutter\'s Mercy',
  'Home',
  'Lethean Temptation',
  'Lonely Warrior',
  'Magnum Opus',
  'Matryoshka',
  'Mawr Blaidd',
  'Misery in Darkness',
  'Outfoxed',
  'Succor of the Sinless',
  'Temperance',
  'The Artist',
  'The Bargain',
  'The Destination',
  'The Emptiness',
  'The Enlightened',
  'The Eternal War',
  'The Formless Sea',
  'The Fortunate',
  'The Greatest Intentions',
  'The Gulf',
  'The Hook',
  'The Last Supper',
  'The Mad King',
  'The Mayor',
  'The Sacrifice',
  'The Shieldbearer',
  'The Soul',
  'The World Eater',
  'Tranquillity'
]);

/**
 * List of cards that should be assigned to B tier by default, regardless of value.
 */
const B_TIER_CARDS =  new Set([
    'A Familiar Call',
    'A Fate Worse Than Death',
    'Abandoned Wealth',
    'Alluring Bounty',
    'Altered Perception',
    'Anarchy\'s Price',
    'Azyran\'s Reward',
    'Beauty Through Death',
    'Brush, Paint and Palette',
    'Burning Blood',
    'Chaotic Disposition',
    'Chasing Risk',
    'Council of Cats',
    'Deadly Joy',
    'Eternal Bonds',
    'Gift of Asenath',
    'Hunter\'s Reward',
    'Judging Voices',
    'Lachrymal Necrosis',
    'Lingering Remnants',
    'Peaceful Moments',
    'Rebirth and Renewal',
    'Remembrance',
    'Something Dark',
    'Terrible Secret of Space',
    'The Academic',
    'The Aspirant',
    'The Astromancer',
    'The Bitter Blossom',
    'The Brawny Battle Mage',
    'The Catch',
    'The Damned',
    'The Deep Ones',
    'The Dreamer',
    'The Eldritch Decay',
    'The Enforcer',
    'The Escape',
    'The Eye of the Dragon',
    'The Fishmonger',
    'The Garish Power',
    'The Last Laugh',
    'The Last One Standing',
    'The Leviathan',
    'The Life Thief',
    'The Long Con',
    'The Old Man',
    'The Patient',
    'The Polymath',
    'The Price of Loyalty',
    'The Saint\'s Treasure',
    'The Scout',
    'The Shortcut',
    'The Side Quest',
    'The Strategist',
    'The Vast',
    'The Void',
    'The Wedding Gift',
    'Toxic Tidings',
    'Underground Forest',
    'Void of the Elements',
    'Who Asked',
    'Winter\'s Embrace'
  ]);

/**
 * List of cards that should be assigned to C tier by default, regardless of value.
 */
const C_TIER_CARDS = new Set([
  'A Sea of Blue',
  'Acclimatisation',
  'Ambitious Obsession',
  'Bowyer\'s Dream',
  'Buried Treasure',
  'Cameria\'s Cut',
  'Checkmate',
  'Dementophobia',
  'Demigod\'s Wager',
  'Disdain',
  'Emperor\'s Luck',
  'Harmony of Souls',
  'Humility',
  'Immortal Resolve',
  'Last Hope',
  'Lucky Connections',
  'Lucky Deck',
  'Man With Bear',
  'More is Never Enough',
  'No Traces',
  'Runic Luck',
  'Sambodhi\'s Vow',
  'Society\'s Remorse',
  'The Cacophony',
  'The Card Sharp',
  'The Cartographer',
  'The Ethereal',
  'The Finishing Touch',
  'The Fool',
  'The Heroic Shot',
  'The Hoarder',
  'The Innocent',
  'The Inventor',
  'The Master Artisan',
  'The Price of Prescience',
  'The Price of Protection',
  'The Rusted Bard',
  'The Seeker',
  'The Tinkerer\'s Table',
  'The Tireless Extractor',
  'The Transformation',
  'The Union',
  'The White Knight',
  'The Wrath',
  'Three Faces in the Dark',
  'Vanity',
  'Vinia\'s Token'
]);

/**
 * List of cards that should be assigned to D tier by default, regardless of value.
 */
const D_TIER_CARDS = new Set([
  'A Chilling Wind',
  'A Dab of Ink',
  'A Dusty Memory',
  'Akil\'s Prophecy',
  'Alone in the Darkness',
  'Arrogance of the Vaal',
  'Assassin\'s Favour',
  'Astral Protection',
  'Atziri\'s Arsenal',
  'Baited Expectations',
  'Bijoux',
  'Blind Venture',
  'Boon of the First Ones',
  'Bound by Flame',
  'Broken Truce',
  'Brotherhood in Exile',
  'Costly Curio',
  'Dark Dreams',
  'Deathly Designs',
  'Desperate Crusade',
  'Dialla\'s Subjugation',
  'Doedre\'s Madness',
  'Draped in Dreams',
  'Dying Light',
  'Earth Drinker',
  'Eldritch Perfection',
  'Emperor of Purity',
  'Endless Night',
  'Etched in Blood',
  'Further Invention',
  'Gift of the Gemling Queen',
  'Glimmer of Hope',
  'Guardian\'s Challenge',
  'Haunting Shadows',
  'Heterochromia',
  'Hope',
  'Hubris',
  'Hunter\'s Resolve',
  'Jack in the Box',
  'Justified Ambition',
  'Keeper\'s Corruption',
  'Left to Fate',
  'Lysah\'s Respite',
  'Mitts',
  'Nook\'s Crown',
  'Parasitic Passengers',
  'Perfection',
  'Poisoned Faith',
  'Prejudice',
  'Pride Before the Fall',
  'Pride of the First Ones',
  'Prometheus\' Armoury',
  'Rebirth',
  'Sambodhi\'s Wisdom',
  'The Admirer',
  'The Aesthete',
  'The Awakened',
  'The Bear Woman',
  'The Blessing of Moosh',
  'The Body',
  'The Bones',
  'The Breach',
  'The Brittle Emperor',
  'The Cache',
  'The Celestial Justicar',
  'The Celestial Stone',
  'The Chains that Bind',
  'The Chosen',
  'The Craving',
  'The Dapper Prodigy',
  'The Darkest Dream',
  'The Doppelganger',
  'The Dungeon Master',
  'The Easy Stroll',
  'The Encroaching Darkness',
  'The Enthusiasts',
  'The Forgotten Treasure',
  'The Forward Gaze',
  'The Hale Heart',
  'The Hive of Knowledge',
  'The Hunger',
  'The King\'s Heart',
  'The Landing',
  'The Lion',
  'The Magma Crab',
  'The Mercenary',
  'The Messenger',
  'The Mind\'s Eyes',
  'The Offspring',
  'The One That Got Away',
  'The One With All',
  'The Penitent',
  'The Porcupine',
  'The Primordial',
  'The Prince of Darkness',
  'The Professor',
  'The Queen',
  'The Risk',
  'The Rite of Elements',
  'The Road to Power',
  'The Shepherd\'s Sandals',
  'The Spark and the Flame',
  'The Thaumaturgist',
  'The Tower',
  'The Traitor',
  'The Tumbleweed',
  'The Undaunted',
  'The Undisputed',
  'The Unexpected Prize',
  'The Valkyrie',
  'The Warlord',
  'The Whiteout',
  'The Wilted Rose',
  'The Wolf',
  'The Wolf\'s Legacy',
  'The Wolven King\'s Bite',
  'The Wolverine',
  'The Wretched',
  'Time-Lost Relic',
  'Unchained',
  'When Currents Blaze'
]);

/**
 * List of cards that should be assigned to E tier by default, regardless of value.
 */
const E_TIER_CARDS = new Set([
  'Boon of Justice',
  'Coveted Possession',
  'Ever-Changing',
  'Gemcutter\'s Promise',
  'Her Mask',
  'Loyalty',
  'Rain of Chaos',
  'The Catalyst',
  'The Deal',
  'The Flora\'s Gift',
  'The Gambler',
  'The Gemcutter',
  'The Journey',
  'The Puzzle',
  'The Scholar',
  'The Survivalist',
  'Three Voices'
]);

/**
 * List of cards that should be assigned to F tier by default, regardless of value.
 */
const F_TIER_CARDS = new Set([
  'A Mother\'s Parting Gift',
  'A Note in the Wind',
  'Alivia\'s Grace',
  'Audacity',
  'Azure Rage',
  'Boundless Realms',
  'Call to the First Ones',
  'Cartographer\'s Delight',
  'Cursed Words',
  'Dark Temptation',
  'Death',
  'Destined to Crumble',
  'Dying Anguish',
  'Echoes of Love',
  'Forbidden Power',
  'From Bone to Ashes',
  'Grave Knowledge',
  'Imperial Legacy',
  'Lantador\'s Lost Love',
  'Light and Truth',
  'Lost Worlds',
  'Merciless Armament',
  'Might is Right',
  'Prosperity',
  'Rain Tempter',
  'Rats',
  'Reckless Ambition',
  'Scholar of the Seas',
  'Shard of Fate',
  'Silence and Frost',
  'Struck by Lightning',
  'The Adventuring Spirit',
  'The Archmage\'s Right Hand',
  'The Arena Champion',
  'The Army of Blood',
  'The Avenger',
  'The Battle Born',
  'The Beast',
  'The Betrayal',
  'The Blazing Fire',
  'The Calling',
  'The Carrion Crow',
  'The Cataclysm',
  'The Coming Storm',
  'The Conduit',
  'The Cursed King',
  'The Dark Mage',
  'The Deceiver',
  'The Demoness',
  'The Dragon',
  'The Dreamland',
  'The Drunken Aristocrat',
  'The Endurance',
  'The Explorer',
  'The Fathomless Depths',
  'The Feast',
  'The Fletcher',
  'The Forsaken',
  'The Fox',
  'The Fox in the Brambles',
  'The Gentleman',
  'The Gladiator',
  'The Golden Era',
  'The Harvester',
  'The Hermit',
  'The Incantation',
  'The Inoculated',
  'The Insatiable',
  'The Jester',
  'The Jeweller\'s Boon',
  'The Journalist',
  'The King\'s Blade',
  'The Lich',
  'The Long Watch',
  'The Lord in Black',
  'The Lord of Celebration',
  'The Lover',
  'The Lunaris Priestess',
  'The Metalsmith\'s Gift',
  'The Mountain',
  'The Oath',
  'The Offering',
  'The Opulent',
  'The Pack Leader',
  'The Pact',
  'The Poet',
  'The Rabid Rhoa',
  'The Realm',
  'The Return of the Rat',
  'The Ruthless Ceinture',
  'The Scarred Meadow',
  'The Scavenger',
  'The Sigil',
  'The Siren',
  'The Skeleton',
  'The Spoiled Prince',
  'The Standoff',
  'The Stormcaller',
  'The Summoner',
  'The Sun',
  'The Surgeon',
  'The Surveyor',
  'The Sword King\'s Salute',
  'The Throne',
  'The Trial',
  'The Twilight Moon',
  'The Twins',
  'The Tyrant',
  'The Visionary',
  'The Warden',
  'The Watcher',
  'The Web',
  'The Wind',
  'The Witch',
  'The Wolf\'s Shadow',
  'Thirst for Knowledge',
  'Thunderous Skies',
  'Treasure Hunter',
  'Triskaidekaphobia',
  'Turn the Other Cheek',
  'Vile Power',
  'Volatile Power'
]);

/**
 * Assign card to default tier based on value.
 * Special S-tier, A-tier, B-tier, C-tier, D-tier, E-tier, and F-tier cards are assigned to their respective tiers regardless of value.
 * @param card - Card to assign
 * @returns Default tier identifier
 */
export function assignCardToDefaultTier(card: DivinationCard): DefaultTier {
  // Check if card is in the special S-tier list
  if (S_TIER_CARDS.has(card.name)) {
    return 'S';
  }
  
  // Check if card is in the special A-tier list
  if (A_TIER_CARDS.has(card.name)) {
    return 'A';
  }
  
  // Check if card is in the special B-tier list
  if (B_TIER_CARDS.has(card.name)) {
    return 'B';
  }
  
  // Check if card is in the special C-tier list
  if (C_TIER_CARDS.has(card.name)) {
    return 'C';
  }
  
  // Check if card is in the special D-tier list
  if (D_TIER_CARDS.has(card.name)) {
    return 'D';
  }
  
  // Check if card is in the special E-tier list
  if (E_TIER_CARDS.has(card.name)) {
    return 'E';
  }
  
  // Check if card is in the special F-tier list
  if (F_TIER_CARDS.has(card.name)) {
    return 'F';
  }
  
  // Otherwise, assign based on value
  const value = card.value;
  
  if (value > 1000) return 'S';
  if (value > 500) return 'A';
  if (value > 200) return 'B';
  if (value > 50) return 'C';
  if (value > 10) return 'D';
  if (value > 1) return 'E';
  return 'F';
}

/**
 * Create default tier configurations with predefined color schemes.
 * @returns Map of tier ID to TierConfiguration
 */
export function createDefaultTierConfigurations(): Map<string, TierConfiguration> {
  const configs = new Map<string, TierConfiguration>();
  const now = Date.now();
  
  // Default color schemes based on user specification
  const defaultColors: Record<DefaultTier, ColorScheme> = {
    S: { 
      backgroundColor: '#FFFFFF', // White background (rgb(255, 255, 255))
      textColor: '#0000FF',       // Blue text (rgb(0, 0, 255))
      borderColor: '#0000FF',     // Blue border (rgb(0, 0, 255))
      borderWidth: 2
    },
    A: { 
      backgroundColor: '#0014B4', // Dark blue background (rgb(0, 20, 180)) - from Tier B
      textColor: '#FFFFFF',       // White text (rgb(255, 255, 255)) - from Tier B
      borderColor: '#FFFFFF',     // White border (rgb(255, 255, 255)) - from Tier B
      borderWidth: 2
    },
    B: { 
      backgroundColor: '#00DCF0', // Cyan/Light Blue background (rgb(0, 220, 240)) - from Tier C
      textColor: '#000000',       // Black text (rgb(0, 0, 0)) - from Tier C
      borderColor: '#000000',     // Black border (rgb(0, 0, 0)) - from Tier C
      borderWidth: 2
    },
    C: { 
      backgroundColor: '#278DC0', // Darker light blue background (rgb(39, 141, 192)) - from Tier D
      textColor: '#000000',       // Black text (rgb(0, 0, 0)) - from Tier D
      borderColor: '#000000',     // Black border (rgb(0, 0, 0)) - from Tier D
      borderWidth: 2
    },
    D: { 
      backgroundColor: '#278DC0', // Darker light blue background (rgb(39, 141, 192))
      textColor: '#000000',       // Black text (rgb(0, 0, 0))
      borderColor: '#000000',     // Black border (rgb(0, 0, 0))
      borderWidth: 2
    },
    E: { 
      backgroundColor: '#141400', // Dark yellow/olive background (rgb(20, 20, 0))
      textColor: '#278DC0',       // Darker light blue text (rgb(39, 141, 192))
      borderColor: '#278DC0',     // Darker light blue border (rgb(39, 141, 192))
      borderWidth: 2
    },
    F: { 
      backgroundColor: '#141400', // Dark yellow/olive background (rgb(20, 20, 0))
      textColor: '#278DC0',       // Darker light blue text (rgb(39, 141, 192))
      borderColor: '#278DC0',     // Darker light blue border (rgb(39, 141, 192))
      borderWidth: 2
    }
  };
  
  // Default beam colors for each tier - distinct, vibrant colors
  const defaultBeamColors: Record<DefaultTier, string> = {
    S: '#FFD700',  // Gold - highest tier deserves premium color
    A: '#FF0000',  // Red - strong, premium color
    B: '#0000FF',  // Blue - classic blue
    C: '#00DCF0',  // Cyan - matches tier's background color
    D: '#00FF00',  // Green - distinct vibrant color
    E: '#FF8C00',  // Orange - warm, distinct color
    F: '#9D4EDD'   // Purple - distinct color for lowest tier
  };
  
  const defaultTiers: DefaultTier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let i = 0; i < defaultTiers.length; i++) {
    const tierId = defaultTiers[i];
    configs.set(tierId, {
      colorScheme: defaultColors[tierId],
      sound: { filePath: null, volume: 1.0, enabled: true },
      enabled: true,
      lightBeam: { enabled: true, color: defaultBeamColors[tierId] },
      modifiedAt: now
    });
  }
  
  return configs;
}

/**
 * Create default tiers with configurations.
 * @returns Map of tier ID to Tier object
 */
export function createDefaultTiers(): Map<string, Tier> {
  const tiers = new Map<string, Tier>();
  const configs = createDefaultTierConfigurations();
  const now = Date.now();
  
  const defaultTiers: DefaultTier[] = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let i = 0; i < defaultTiers.length; i++) {
    const tierId = defaultTiers[i];
    tiers.set(tierId, {
      id: tierId,
      name: tierId,
      type: 'default',
      order: i,
      config: configs.get(tierId)!,
      modifiedAt: now
    });
  }
  
  return tiers;
}

