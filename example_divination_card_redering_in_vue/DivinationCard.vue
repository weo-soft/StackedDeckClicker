<script setup lang="ts">
import { computed } from 'vue'
import type { DivinationCard } from '@/model/divinationCard'

interface PropsInterface {
  card: DivinationCard
  width?: number
}

const props = defineProps<PropsInterface>()

const frameUrl = computed(() => new URL('../../assets/images/Divination_card_frame.png', import.meta.url).href)
const separatorUrl = computed(() => new URL('../../assets/images/Divination_card_separator.png', import.meta.url).href)

// Load all card art images at build time
const cardArtModules = import.meta.glob('../../assets/images/divinationcards/*.png', { eager: true }) as Record<string, { default: string }>

function getCardArtUrl(card: DivinationCard): string | undefined {
  // Use artFilename directly from the card data
  if (!card.artFilename) {
    return undefined
  }
  
  // Build the expected filename: {artFilename}.png
  const expectedFilename = `${card.artFilename}.png`
  
  // Find the module that matches this filename (case-insensitive)
  const modulePath = Object.keys(cardArtModules).find(path => {
    // Extract just the filename from the path (handle both / and \ separators)
    const pathFilename = path.split(/[/\\]/).pop() || ''
    
    // Case-insensitive comparison
    return pathFilename.toLowerCase() === expectedFilename.toLowerCase()
  })
  
  if (modulePath) {
    // Return the resolved URL from Vite
    return cardArtModules[modulePath].default
  }
  
  return undefined
}

const cardWidth = computed(() => props.width ?? 300)
const scaleFactor = computed(() => cardWidth.value / 300) // Base size is 300px

const containerStyle = computed(() => {
  const width = cardWidth.value
  const height = Math.round(width * (455 / 300))
  return { width: `${width}px`, height: `${height}px` }
})

// Dynamic font sizes based on card width
const titleFontSize = computed(() => `${16 * scaleFactor.value}px`)
const stackFontSize = computed(() => `${12 * scaleFactor.value}px`)
const rewardFontSize = computed(() => `${14 * scaleFactor.value}px`)
const rewardSmallFontSize = computed(() => `${11 * scaleFactor.value}px`)
const rewardXSmallFontSize = computed(() => `${9.5 * scaleFactor.value}px`)
const rewardXXSmallFontSize = computed(() => `${8.5 * scaleFactor.value}px`)
const flavourFontSize = computed(() => `${12 * scaleFactor.value}px`)
const letterSpacing = computed(() => `${0.5 * scaleFactor.value}px`)

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Parse styling metadata and convert to HTML with CSS classes
 * Format: <STYLING-METADATA>{TEXT}
 * Example: <uniqueitem>{The Poet's Pen} -> <span class="poe-style-uniqueitem">The Poet's Pen</span>
 * Handles nested tags and preserves newlines by converting them to <br> tags
 */
function parseStyledText(text: string): string {
  // First, convert newlines to a temporary marker to preserve them
  const newlineMarker = '___NEWLINE___'
  let result = text.replace(/\n/g, newlineMarker)
  
  // Process tags from innermost to outermost
  // We'll repeatedly find and replace tags that don't contain other tags
  let changed = true
  let iterations = 0
  const maxIterations = 100 // Safety limit to prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false
    iterations++
    
    // Pattern to match: <tag>{content}
    // We need to find the matching closing brace, handling nested braces
    const tagPattern = /<([^>]+)>\{/g
    let match
    
    // Find all tag openings and process them from right to left (innermost first)
    const tagMatches: Array<{ start: number; tag: string; contentStart: number; contentEnd: number }> = []
    
    while ((match = tagPattern.exec(result)) !== null) {
      const tagStart = match.index
      const tag = match[1]
      const contentStart = match.index + match[0].length
      
      // Find the matching closing brace by counting brace depth
      let depth = 1
      let pos = contentStart
      let contentEnd = -1
      
      while (pos < result.length && depth > 0) {
        if (result[pos] === '{') {
          depth++
        } else if (result[pos] === '}') {
          depth--
          if (depth === 0) {
            contentEnd = pos
            break
          }
        }
        pos++
      }
      
      if (contentEnd !== -1) {
        const content = result.substring(contentStart, contentEnd)
        // Check if content contains unprocessed tags (pattern: <tag>{)
        // We only skip if the content contains unprocessed tags (like <gemitem>{)
        // Already-processed HTML tags (like <span>) are fine
        const hasUnprocessedTags = /<[^/>]+>\{/.test(content)
        if (!hasUnprocessedTags) {
          tagMatches.push({
            start: tagStart,
            tag,
            contentStart,
            contentEnd
          })
        }
      }
    }
    
    // Process matches from right to left (innermost first) to avoid index shifting issues
    tagMatches.reverse().forEach(tagMatch => {
      const content = result.substring(tagMatch.contentStart, tagMatch.contentEnd)
      const cssClass = `poe-style-${tagMatch.tag.replace(/:/g, '-')}`
      const replacement = `<span class="${cssClass}">${content}</span>`
      
      // Replace the entire tag including braces at the specific position
      const before = result.substring(0, tagMatch.start)
      const after = result.substring(tagMatch.contentEnd + 1)
      result = before + replacement + after
      changed = true
    })
  }
  
  // Convert newline markers to <br> tags BEFORE escaping
  result = result.replace(new RegExp(newlineMarker, 'g'), '<br>')
  
  // Now we need to escape text content but preserve HTML tags (<span> and <br>)
  // Split by HTML tags and escape only the text parts
  const htmlTagRegex = /(<(?:span|br)[^>]*>|<\/span>)/gi
  const parts = result.split(htmlTagRegex)
  
  let output = ''
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    // Check if this part is an HTML tag
    if (part && (part.startsWith('<span') || part.startsWith('<br') || part === '</span>')) {
      output += part
    } else if (part) {
      // Escape text content
      output += escapeHtml(part)
    }
  }
  
  return output.trim()
}

function formatRewardText(): string {
  const raw = (props.card.explicitModifiers || [])
    .map(m => m.text)
    .join('\n')
  return parseStyledText(raw)
}

// Plain text version for length calculation (used for sizing)
function formatRewardTextPlain(): string {
  const raw = (props.card.explicitModifiers || [])
    .map(m => m.text)
    .join('\n')
  return raw
    .replace(/<[^>]+>\{([^}]*)\}/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
}

const rewardClass = computed(() => {
  const text = formatRewardTextPlain()
  const length = text.length
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (length > 70 || words >= 9) return 'xxsmall'
  if (length > 50 || words >= 7) return 'xsmall'
  if (length > 30 || words >= 5) return 'small'
  return 'normal'
})

function getRewardStyle(): Record<string, string> {
  const baseStyle: Record<string, string> = {
    fontSize: rewardFontSize.value,
  }
  
  // Add letter spacing based on reward class
  if (rewardClass.value === 'small') {
    baseStyle.fontSize = rewardSmallFontSize.value
    baseStyle.letterSpacing = `${0.3 * scaleFactor.value}px`
    baseStyle.lineHeight = '1.18'
  } else if (rewardClass.value === 'xsmall') {
    baseStyle.fontSize = rewardXSmallFontSize.value
    baseStyle.letterSpacing = `${0.2 * scaleFactor.value}px`
    baseStyle.lineHeight = '1.12'
  } else if (rewardClass.value === 'xxsmall') {
    baseStyle.fontSize = rewardXXSmallFontSize.value
    baseStyle.letterSpacing = `${0.15 * scaleFactor.value}px`
    baseStyle.lineHeight = '1.08'
  }
  
  return baseStyle
}

function formatFlavourText(): string {
  let text = props.card.flavourText || ''
  // Remove wiki/markup tags like <size:27>, <smaller>, <magicitem>, etc.
  text = text.replace(/<[^>]*>/g, '')
  // Remove surrounding braces often used on wiki examples
  text = text.replace(/^\s*[\{\[\(\"'“’”]+/, '').replace(/[\}\]\)\"'“’”]+\s*$/, '')
  // Collapse multiple spaces and normalize whitespace/newlines
  text = text.replace(/\s+/g, ' ').trim()
  return text
}
</script>

<template>
  <div class="div-card-preview" :style="containerStyle">
    <img class="div-card-frame" :src="frameUrl" alt="Divination frame">
    <div 
      class="div-card-title div-card-text-base" 
      :style="{ fontSize: titleFontSize, letterSpacing: letterSpacing }"
    >
      {{ props.card.name }}
    </div>
    <img v-if="getCardArtUrl(props.card)" class="div-card-art" :src="getCardArtUrl(props.card)" :alt="props.card.name">
    <div 
      v-if="props.card.stackSize" 
      class="div-card-stack"
      :style="{ fontSize: stackFontSize }"
    >
      {{ props.card.stackSize }}
    </div>
    <div 
      class="div-card-reward div-card-text-base" 
      :class="rewardClass"
      :style="getRewardStyle()"
      v-html="formatRewardText()"
    ></div>
    <img class="div-card-separator" :src="separatorUrl" alt="separator">
    <div 
      class="div-card-flavour div-card-text-base"
      :style="{ fontSize: flavourFontSize }"
    >
      {{ formatFlavourText() }}
    </div>
  </div>
  <slot />
</template>

<style scoped>
.div-card-preview {
  position: relative;
}

.div-card-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 2;
  pointer-events: none;
}

.div-card-text-base {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  text-rendering: optimizeLegibility;
}

.div-card-art {
  position: absolute;
  left: 4%;
  right: 4%;
  top: 9%;
  height: 44%;
  object-fit: cover;
  z-index: 1;
}

.div-card-separator {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 66%;
  width: 84%;
  object-fit: contain;
  z-index: 3;
  pointer-events: none;
  opacity: 0.8;
}

.div-card-stack {
  position: absolute;
  top: 46.5%;
  left: 13%;
  width: 8.5%;
  height: 5%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  line-height: 1;
  z-index: 4;
  text-shadow: 0 1px 0 rgba(0,0,0,0.8);
}

.div-card-reward {
  position: absolute;
  top: 56%;
  left: 8%;
  right: 8%;
  text-align: center;
  color: #d7a14d;
  text-transform: uppercase;
  font-weight: 700;
  z-index: 3;
  text-shadow: 0 1px 0 rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.15);
  white-space: normal; /* Allow line breaks */
  line-height: 1.2; /* Better line spacing for multi-line text */
  transform: translateY(-2%); /* Move text up slightly for better multiline positioning */
}

.div-card-reward :deep(br) {
  display: block;
  content: "";
  margin: 0;
}

.div-card-flavour {
  position: absolute;
  top: 73%;
  left: 8%;
  right: 8%;
  text-align: center;
  color: #d4a46a;
  font-style: italic;
  line-height: 1.3;
  z-index: 3;
  text-shadow: 0 1px 0 rgba(0,0,0,0.5);
}

.div-card-title {
  position: absolute;
  top: 3%;
  left: 8%;
  right: 8%;
  text-align: center;
  color: #1a1a1a;
  font-weight: 700;
  text-transform: uppercase;
  z-index: 4;
  text-shadow: 0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(0,0,0,0.3);
}

/* Path of Exile styling metadata classes - use :deep() to target v-html content */
.div-card-reward :deep(.poe-style-uniqueitem) {
  color: #ff8c42 !important; /* Vibrant orange for unique items - matches PoE's unique item color */
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-rareitem) {
  color: #ffeb3b !important; /* Bright vibrant yellow for rare items */
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-magicitem) {
  color: #8888ff !important; /* Vibrant purple-blue for magic items */
  text-transform: uppercase !important;
  font-weight: 700 !important; /* Bold for item names */
}

.div-card-reward :deep(.poe-style-whiteitem) {
  color: #ffffff !important; /* Pure white for white/normal items */
  text-transform: none !important; /* Title case, not uppercase */
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-currencyitem) {
  color: #d7a14d !important; /* Light desaturated golden-yellow for currency items */
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-gemitem) {
  color: #1ba29b !important; /* Teal/cyan for gem items */
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-divination) {
  color: #5fb3d3 !important; /* Vibrant light blue/cyan for divination cards */
  text-transform: uppercase !important;
  font-weight: 700 !important;
}

.div-card-reward :deep(.poe-style-default) {
  color: #888888 !important; /* Medium grey for default text */
  font-weight: 400 !important;
  text-transform: none !important; /* Title case, not uppercase */
}

.div-card-reward :deep(.poe-style-normal) {
  color: #888888 !important; /* Medium grey for normal text */
  font-weight: 400 !important;
  text-transform: none !important; /* Override parent uppercase */
}

.div-card-reward :deep(.poe-style-augmented) {
  color: #a080ff !important; /* Medium purple/lavender for augmented mods */
  font-weight: 400 !important;
  text-transform: uppercase !important;
}

.div-card-reward :deep(.poe-style-corrupted) {
  color: #e00000 !important; /* Bright red for corrupted items */
  font-weight: 700 !important;
  text-transform: uppercase !important;
}

.div-card-reward :deep(.poe-style-fractured) {
  color: #b8860b !important; /* Muted gold/bronze for fractured items */
  font-weight: 700 !important;
  text-transform: uppercase !important;
}

.div-card-reward :deep(.poe-style-enchanted) {
  color: #888888 !important; /* Medium grey for enchanted/implicit modifier labels */
  font-weight: 400 !important;
  text-transform: none !important; /* Title case, not uppercase */
}

/* Size modifiers - these will override font size
 * Default size is assumed to be 32, so size:31 = 31/32 = 0.969em relative to base
 * All sizes are calculated as (sizeValue / 32) relative to the parent font size
 */
.div-card-reward :deep(.poe-style-size-24) {
  font-size: calc(24 / 32 * 1em) !important; /* 0.75em */
}

.div-card-reward :deep(.poe-style-size-25) {
  font-size: calc(25 / 32 * 1em) !important; /* 0.781em */
}

.div-card-reward :deep(.poe-style-size-26) {
  font-size: calc(26 / 32 * 1em) !important; /* 0.813em */
}

.div-card-reward :deep(.poe-style-size-27) {
  font-size: calc(27 / 32 * 1em) !important; /* 0.844em */
}

.div-card-reward :deep(.poe-style-size-28) {
  font-size: calc(28 / 32 * 1em) !important; /* 0.875em */
}

.div-card-reward :deep(.poe-style-size-29) {
  font-size: calc(29 / 32 * 1em) !important; /* 0.906em */
}

.div-card-reward :deep(.poe-style-size-30) {
  font-size: calc(30 / 32 * 1em) !important; /* 0.938em */
}

.div-card-reward :deep(.poe-style-size-31) {
  font-size: calc(31 / 32 * 1em) !important; /* 0.969em */
}
</style>


