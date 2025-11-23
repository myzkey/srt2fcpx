import type { SrtCue, SrtParseResult } from '~/types'

/**
 * Parse SRT subtitle file content
 * @param source SRT file content as string
 * @returns Parsed cues and any errors encountered
 */
export function parseSrt(source: string): SrtParseResult {
  const cues: SrtCue[] = []
  const errors: string[] = []

  // Normalize line endings and split into blocks
  const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const blocks = normalized.split(/\n\n+/).filter((block) => block.trim())

  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      errors.push(`Skipping incomplete block: ${block.substring(0, 50)}`)
      continue
    }

    try {
      // Parse index (first line)
      const indexLine = lines[0].trim()
      const index = parseInt(indexLine, 10)

      if (Number.isNaN(index)) {
        errors.push(`Invalid index: ${indexLine}`)
        continue
      }

      // Parse timecode (second line)
      const timecodeLine = lines[1].trim()
      const timecodeMatch = timecodeLine.match(
        /^(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})$/,
      )

      if (!timecodeMatch) {
        errors.push(`Invalid timecode format: ${timecodeLine}`)
        continue
      }

      const [, startH, startM, startS, startMs, endH, endM, endS, endMs] =
        timecodeMatch

      const startTime = parseTimecode(
        parseInt(startH, 10),
        parseInt(startM, 10),
        parseInt(startS, 10),
        parseInt(startMs, 10),
      )

      const endTime = parseTimecode(
        parseInt(endH, 10),
        parseInt(endM, 10),
        parseInt(endS, 10),
        parseInt(endMs, 10),
      )

      if (endTime <= startTime) {
        errors.push(
          `End time must be after start time in cue ${index}: ${timecodeLine}`,
        )
        continue
      }

      // Parse text (remaining lines)
      let text = lines.slice(2).join('\n')
      // Remove leading and trailing newlines but preserve intentional spaces
      text = text.replace(/^\n+/, '').replace(/\n+$/, '')

      // Strip HTML tags and decode entities for clean text output
      text = stripHtmlTags(text)
      text = decodeHtmlEntities(text)

      if (!text) {
        errors.push(`Empty text in cue ${index}`)
      }

      cues.push({
        index,
        startMs: startTime,
        endMs: endTime,
        text,
      })
    } catch (error) {
      errors.push(
        `Error parsing block: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return { cues, errors }
}

/**
 * Convert hours, minutes, seconds, and milliseconds to total milliseconds
 */
function parseTimecode(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): number {
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds
}

/**
 * Convert milliseconds to SRT timecode format (HH:MM:SS,mmm)
 */
export function formatSrtTimecode(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = ms % 1000

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number): string {
  return num.toString().padStart(length, '0')
}

/**
 * HTML entity mapping for decoding
 */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
}

/**
 * Decode HTML entities in text
 */
export function decodeHtmlEntities(text: string): string {
  let decoded = text

  // Handle named entities (case insensitive)
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    decoded = decoded.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), char)
  }

  // Handle numeric entities (decimal: &#65; = 'A')
  // Also handle negative numbers which should be treated as invalid
  decoded = decoded.replace(/&#(-?\d+);/g, (match, code) => {
    const num = parseInt(code, 10)
    // Valid Unicode range: 1 to 1114111 (0x10FFFF) - Full Unicode support
    // Exclude surrogate code points (0xD800-0xDFFF) and some control characters
    if (num >= 1 && num <= 0x10FFFF) {
      // Exclude surrogate pairs
      if (num >= 0xD800 && num <= 0xDFFF) {
        return '' // Invalid surrogate pair
      }
      try {
        // String.fromCodePoint() for full Unicode support (including emoji)
        const char = String.fromCodePoint(num)
        // Additional check to ensure it's a valid character
        return char && char !== '\uFFFD' ? char : ''
      } catch {
        return ''
      }
    }
    return ''
  })

  // Handle hex entities (hex: &#x41; = 'A')
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    const num = parseInt(hex, 16)
    // Valid Unicode range: 1 to 1114111 (0x10FFFF) - Full Unicode support
    if (num >= 1 && num <= 0x10FFFF) {
      // Exclude surrogate pairs
      if (num >= 0xD800 && num <= 0xDFFF) {
        return '' // Invalid surrogate pair
      }
      try {
        // String.fromCodePoint() for full Unicode support (including emoji)
        const char = String.fromCodePoint(num)
        return char && char !== '\uFFFD' ? char : ''
      } catch {
        return ''
      }
    }
    return ''
  })

  return decoded
}

/**
 * Validate style attribute values to prevent CSS injection attacks
 */
function validateStyleAttribute(styleValue: string): boolean {
  const dangerousPatterns = [
    /javascript:/i,    // JavaScript URLs
    /data:/i,          // Data URLs
    /expression\s*\(/i, // IE CSS expressions
    /behavior\s*:/i,   // IE behaviors
    /-moz-binding:/i,  // Firefox bindings
    /@import/i,        // CSS imports
    /url\s*\(/i,       // URL functions (could contain data: or javascript:)
    /vbscript:/i,      // VBScript URLs
    /&\s*\{/,          // IE conditional comments in CSS
    /\/\*[\s\S]*?\*\// // CSS comments (could hide injection)
  ]

  return !dangerousPatterns.some(pattern => pattern.test(styleValue))
}

/**
 * Strip HTML-like tags from text with enhanced security and functionality
 */
export function stripHtmlTags(text: string): string {
  const originalText = text
  let cleaned = text

  // Track if we actually processed any HTML content
  const hadHtmlTags = /<[^>]*>/.test(text)
  const hadHtmlComments = /<!--[\s\S]*?-->/.test(text)
  const hadHtmlEntities = /&[#\w]+;/.test(text)

  // Remove HTML comments with proper nesting handling
  // Use a stack-based approach to handle nested comments correctly
  let result = ''
  let i = 0
  let commentDepth = 0

  while (i < cleaned.length) {
    if (i <= cleaned.length - 4 && cleaned.substring(i, i + 4) === '<!--') {
      // Start of comment
      if (commentDepth === 0) {
        // Add space to separate words if we're starting a new comment
        if (result.length > 0 && !result.endsWith(' ')) {
          result += ' '
        }
      }
      commentDepth++
      i += 4
    } else if (i <= cleaned.length - 3 && cleaned.substring(i, i + 3) === '-->') {
      // End of comment
      if (commentDepth > 0) {
        commentDepth--
        if (commentDepth === 0) {
          // Add space after comment if needed
          if (i + 3 < cleaned.length && !cleaned.charAt(i + 3).match(/\s/)) {
            result += ' '
          }
        }
      } else {
        // Orphaned closing tag, keep it
        result += cleaned.charAt(i)
      }
      i += commentDepth > 0 ? 3 : 1
    } else {
      // Regular character
      if (commentDepth === 0) {
        result += cleaned.charAt(i)
      }
      i++
    }
  }

  cleaned = result

  // Remove script and style content (security measure)
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')

  // Validate and remove dangerous style attributes (CSS injection prevention)
  cleaned = cleaned.replace(/\bstyle\s*=\s*["']([^"']*)["']/gi, (match, styleValue) => {
    if (!validateStyleAttribute(styleValue)) {
      // Remove dangerous style attributes entirely
      return ''
    }
    // For safe styles, we still remove them since we're stripping tags anyway
    // This maintains the existing behavior while adding security validation
    return ''
  })

  // Handle specific tags that should be removed without spaces
  // Formatting tags and inline tags that don't affect word separation
  cleaned = cleaned.replace(/<\/?(?:b|i|u|strong|em|font|small|sub|sup|span|a)(?:\s[^>]*)?\/?>/gi, '')

  // Line break tags
  cleaned = cleaned.replace(/<\/?(?:hr)(?:\s[^>]*)?\/?>/gi, '')

  // Handle <br> tags intelligently:
  // - If <br> follows punctuation, replace with space
  // - Otherwise, remove without space
  cleaned = cleaned.replace(/([.!?:;])<\/?br(?:\s[^>]*)?\/?>/gi, '$1 ')
  cleaned = cleaned.replace(/<\/?br(?:\s[^>]*)?\/?>/gi, '')

  // Handle block-level tags that may need space for word separation
  cleaned = cleaned.replace(/<\/?(?:p|div)(?:\s[^>]*)?\/?>/gi, ' ')

  // Remove remaining HTML/XML tags and replace with space for word separation
  // This preserves spacing for malformed or unknown tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ')

  // Clean up any remaining malformed tag starts
  cleaned = cleaned.replace(/<[^<]*$/g, '')

  // Decode HTML entities BEFORE whitespace cleanup to preserve entity-decoded spaces
  cleaned = decodeHtmlEntities(cleaned)

  // Clean up excessive whitespace but preserve meaningful spacing
  // Replace tabs and other whitespace with regular spaces first
  cleaned = cleaned.replace(/[\t\r\f\v]/g, ' ')

  // Collapse excessive whitespace (3+ consecutive spaces) to double space
  cleaned = cleaned.replace(/ {3,}/g, '  ')

  // Clean up multiple consecutive newlines
  cleaned = cleaned.replace(/\n+/g, '\n')

  // Clean up whitespace around newlines
  cleaned = cleaned.replace(/ +\n/g, '\n').replace(/\n +/g, '\n')

  // Only trim if we actually processed HTML content that could introduce unwanted whitespace
  // Otherwise preserve the original whitespace structure
  if (hadHtmlTags || hadHtmlComments || hadHtmlEntities) {
    // Check if the original contained entities that would create leading/trailing spaces
    const hasLeadingEntitySpace = originalText.match(/^\s*&nbsp;/)
    const hasTrailingEntitySpace = originalText.match(/&nbsp;\s*$/)

    if (!hasLeadingEntitySpace && !hasTrailingEntitySpace) {
      // Normal case - trim both ends since HTML processing likely added whitespace
      cleaned = cleaned.trim()
    } else {
      // Preserve entity-decoded spaces
      if (!hasLeadingEntitySpace) {
        cleaned = cleaned.replace(/^ +/, '')
      }
      if (!hasTrailingEntitySpace) {
        cleaned = cleaned.replace(/ +$/, '')
      }
    }
  } else {
    // No HTML processing needed - only trim whitespace that was clearly added by line processing
    // Remove only leading/trailing newlines and excessive spaces but preserve intentional spaces
    cleaned = cleaned.replace(/^\n+/, '').replace(/\n+$/, '')
  }

  return cleaned
}
