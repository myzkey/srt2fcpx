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
      const text = lines.slice(2).join('\n').trim()

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
 * Strip HTML-like tags from text with enhanced security and functionality
 */
export function stripHtmlTags(text: string): string {
  let cleaned = text

  // Remove HTML comments (<!-- ... -->) and normalize surrounding whitespace
  cleaned = cleaned.replace(/\s*<!--[\s\S]*?-->\s*/g, ' ')

  // Remove script and style content (security measure)
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')

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

  // BUT preserve double spaces that were intentional from malformed tags
  // We need to differentiate between spaces from comments vs spaces from malformed content

  // Clean up multiple consecutive newlines
  cleaned = cleaned.replace(/\n+/g, '\n')

  // Clean up whitespace around newlines
  cleaned = cleaned.replace(/ +\n/g, '\n').replace(/\n +/g, '\n')

  // Trim leading and trailing whitespace, but preserve entity-decoded spaces that are meaningful
  // Check if the original contained entities that would create leading/trailing spaces
  const hasLeadingEntitySpace = text.match(/^\s*&nbsp;/)
  const hasTrailingEntitySpace = text.match(/&nbsp;\s*$/)

  if (!hasLeadingEntitySpace && !hasTrailingEntitySpace) {
    // Normal case - trim both ends
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

  return cleaned
}
