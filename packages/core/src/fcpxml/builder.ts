import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripHtmlTags } from '~/srt/parser'
import { DEFAULT_OPTIONS, type Srt2FcpxOptions, type SrtCue } from '~/types'

/**
 * Convert milliseconds to FCPXML fraction format with frame alignment
 * @param ms Milliseconds
 * @param frameRate Frame rate (default: 24)
 * @returns FCPXML timecode (e.g., "72/24s")
 */
function millisecondsToFraction(ms: number, frameRate: number): string {
  const seconds = ms / 1000
  // Round to frame boundary
  const frames = Math.floor(seconds * frameRate)
  return `${frames}/${frameRate}s`
}

/**
 * Escape text specifically for XML attribute values
 */
function escapeXmlAttribute(text: string): string {
  return (
    text
      // First escape & to prevent double-escaping
      .replace(/&/g, '&amp;')
      // Basic XML entities for attributes
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      // Don't escape apostrophes in attributes when using double quotes
      // Additional escaping for attribute context
      .replace(/\n/g, '&#10;') // Preserve newlines in attributes
      .replace(/\r/g, '&#13;') // Preserve carriage returns
      .replace(/\t/g, '&#9;') // Preserve tabs
      // Remove dangerous control characters (intentional use of control chars)
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional removal of XML-invalid control chars
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      .replace(/[\uD800-\uDFFF]/g, '')
      .replace(/[\uFFFE\uFFFF]/g, '')
  )
}

/**
 * Escape text for XML content (between tags)
 */
function escapeXmlContent(text: string): string {
  return (
    text
      // Essential escaping for content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // Remove only the most dangerous control characters, preserve Unicode
      // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional removal of XML-invalid control chars
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  )
  // Don't remove Unicode surrogates and non-characters - preserve international content
}

/**
 * Validate input for potential XML injection patterns
 */
function validateXmlInput(input: string): {
  isValid: boolean
  reason?: string
} {
  // Check for suspicious patterns that might indicate XML injection attempts
  const dangerousPatterns = [
    /<!(?:DOCTYPE|ENTITY)/i, // DOCTYPE or ENTITY declarations
    /<!-{2,}/, // Comment injection attempts
    /<!\[CDATA\[/i, // CDATA injection attempts
    /\]\]>/, // CDATA closing attempts
    /<\?xml/i, // XML declaration injection
    /<script[^>]*>/i, // Script tags
    /javascript:/i, // JavaScript protocol
    /data:/i, // Data protocol
    // Note: Removed general entity check to allow legitimate HTML entities like &amp;
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        reason: `Potentially dangerous XML pattern detected: ${pattern.source}`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Sanitize and validate XML input with comprehensive security measures
 */
function sanitizeXmlInput(input: string): string {
  // First validate the input
  const validation = validateXmlInput(input)
  if (!validation.isValid) {
    throw new Error(`XML security validation failed: ${validation.reason}`)
  }

  // Apply sanitization
  return (
    input
      // Remove any XML declaration or DOCTYPE
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove CDATA sections (content will be escaped instead)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      // Remove processing instructions
      .replace(/<\?[^>]*\?>/g, '')
  )
}

/**
 * Build XML attributes string from key-value pairs with proper escaping
 * { font: "Hiragino", fontSize: 80 } -> font="Hiragino" fontSize="80"
 */
function buildAttributes(
  attrs: Record<string, string | number | boolean>,
): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      // Validate attribute name (should be valid XML name)
      if (!/^[a-zA-Z_][\w.-]*$/.test(key)) {
        throw new Error(`Invalid XML attribute name: ${key}`)
      }
      // Properly escape attribute value
      const escapedValue = escapeXmlAttribute(String(value))
      return `${key}="${escapedValue}"`
    })
    .join(' ')
}

/**
 * Add indentation to each line of a string
 * @param lines String to indent
 * @param level Indentation level (each level = 2 spaces)
 * @returns Indented string
 */
function indent(lines: string, level: number): string {
  const pad = '  '.repeat(level)
  return lines
    .trim()
    .split('\n')
    .map((line) => pad + line)
    .join('\n')
}

/**
 * Convert hex color (#RRGGBBAA) to FCPXML color format (r g b a)
 * @param hex Hex color string (#RRGGBB or #RRGGBBAA)
 * @returns FCPXML color string (e.g., "1 1 1 1")
 */
function hexToFcpxmlColor(hex: string): string {
  const clean = hex.replace(/^#/, '')

  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  const a = clean.length === 8 ? parseInt(clean.substring(6, 8), 16) / 255 : 1

  // Format: use integers for 0 and 1, decimals for fractional values (match FCP export format)
  const formatValue = (v: number) => {
    if (v === 0) return '0'
    if (v === 1) return '1'
    return v.toString()
  }

  return `${formatValue(r)} ${formatValue(g)} ${formatValue(b)} ${formatValue(
    a,
  )}`
}

/**
 * Get the fixtures directory path
 */
function getFixturesPath(): string {
  // Get the directory of the current module
  const currentDir = dirname(fileURLToPath(import.meta.url))
  // Fixtures are at ../fixtures relative to this file (fcpxml/builder.ts or fcpxml/builder.js)
  return join(currentDir, '..', 'fixtures')
}

/**
 * Load template files
 */
function loadTemplates(): { baseTemplate: string; titleTemplate: string } {
  const fixturesPath = getFixturesPath()
  const baseTemplate = readFileSync(
    join(fixturesPath, 'base-template.fcpxml'),
    'utf-8',
  )
  const titleTemplate = readFileSync(
    join(fixturesPath, 'title-template.xml'),
    'utf-8',
  )
  return { baseTemplate, titleTemplate }
}

/**
 * Build a title XML from template
 */
function buildTitleFromTemplate(
  cue: SrtCue,
  index: number,
  frameRate: number,
  titleTemplate: string,
): string {
  const offset = millisecondsToFraction(cue.startMs, frameRate)
  const start = offset // In this template, start and offset are the same
  const duration = millisecondsToFraction(cue.endMs - cue.startMs, frameRate)

  // Sanitize input, strip HTML tags and escape XML content
  const sanitizedText = sanitizeXmlInput(cue.text)
  const cleanText = stripHtmlTags(sanitizedText)
  const text = escapeXmlContent(cleanText)

  // Create abbreviated display name for clip
  const titlePreview = text.substring(0, 20).replace(/\n/g, ' ')
  const displayName = text.length > 20 ? `${titlePreview}...` : titlePreview

  const styleId = `ts${index + 1}`

  // Replace placeholders in template
  return titleTemplate
    .replace(/{OFFSET}/g, offset)
    .replace(/{START}/g, start)
    .replace(/{DURATION}/g, duration)
    .replace(/{DISPLAY_NAME}/g, displayName)
    .replace(/{STYLE_ID}/g, styleId)
    .replace(/{TEXT}/g, text)
}

/**
 * Convert a single SRT cue to a <title> element
 */
function buildTitleXml(
  cue: SrtCue,
  index: number,
  frameRate: number,
  opts: Required<Srt2FcpxOptions>,
  textColor: string,
  backgroundColor: string,
  strokeColor: string,
): string {
  const offset = millisecondsToFraction(cue.startMs, frameRate)
  const duration = millisecondsToFraction(cue.endMs - cue.startMs, frameRate)

  // Sanitize input, strip HTML tags and escape for XML content
  const sanitizedText = sanitizeXmlInput(cue.text)
  const cleanText = stripHtmlTags(sanitizedText)
  const text = escapeXmlContent(cleanText)

  // Create abbreviated title for clip name
  const titlePreview = text.substring(0, 20).replace(/\n/g, ' ')
  const titleName = text.length > 20 ? `${titlePreview}...` : titlePreview

  const styleId = `ts${index + 1}`

  const attrs: Record<string, string | number> = {
    font: opts.fontFamily,
    fontSize: opts.fontSize,
    fontFace: opts.fontFace,
    fontColor: textColor,
    backgroundColor,
    alignment: 'center',
  }

  // Add stroke attributes if strokeWidth is not 0 (can be positive or negative)
  if (opts.strokeWidth !== 0) {
    attrs.strokeColor = strokeColor
    attrs.strokeWidth = opts.strokeWidth
  }

  const textStyleAttrs = buildAttributes(attrs)

  // Preserve newlines in text content by using placeholder
  const NEWLINE_PLACEHOLDER = '___NEWLINE___'
  const textWithPlaceholder = text.replace(/\n/g, NEWLINE_PLACEHOLDER)

  const xml = `
<title name="Basic Title: ${titleName}" offset="${offset}" ref="r2" duration="${duration}" start="${offset}">
  <text>
    <text-style ref="${styleId}">${textWithPlaceholder}</text-style>
  </text>
  <text-style-def id="${styleId}">
    <text-style ${textStyleAttrs}/>
  </text-style-def>
</title>`

  // Adjust indentation level for spine content
  const indented = indent(xml, 6) // Equivalent to 12 spaces

  // Restore newlines in text content
  return indented.replace(new RegExp(NEWLINE_PLACEHOLDER, 'g'), '\n')
}

/**
 * Build FCPXML from SRT cues
 * @param cues Parsed SRT cues
 * @param options Conversion options
 * @returns FCPXML string
 */
export function buildFcpxml(cues: SrtCue[], options?: Srt2FcpxOptions): string {
  const opts: Required<Srt2FcpxOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const {
    frameRate,
    width,
    height,
    titleName,
    textColor: textColorHex,
    backgroundColor: backgroundHex,
    strokeColor: strokeColorHex,
    formatVersion,
  } = opts

  const maxEndMs = cues.length > 0 ? Math.max(...cues.map((c) => c.endMs)) : 0
  const totalDuration = millisecondsToFraction(maxEndMs, frameRate)

  const textColor = hexToFcpxmlColor(textColorHex)
  const backgroundColor = hexToFcpxmlColor(backgroundHex)
  const strokeColor = hexToFcpxmlColor(strokeColorHex)

  const escapedTitle = escapeXmlContent(titleName)

  const titlesXml = cues
    .map((cue, index) =>
      buildTitleXml(
        cue,
        index,
        frameRate,
        opts,
        textColor,
        backgroundColor,
        strokeColor,
      ),
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="${formatVersion}">
  <resources>
    <format id="r1" name="FFVideoFormat${height}p${frameRate}" frameDuration="1/${frameRate}s" width="${width}" height="${height}"/>
    <effect id="r2" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>

  <library>
    <event name="${escapedTitle}">
      <project name="${escapedTitle}">
        <sequence format="r1" duration="${totalDuration}" tcStart="0s" tcFormat="NDF">
          <spine>
${titlesXml}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`
}

/**
 * Build FCPXML from SRT cues using template-based approach
 * This preserves all FCP-specific parameters and structure
 * @param cues Parsed SRT cues
 * @param options Conversion options
 * @returns FCPXML string
 */
export function buildFcpxmlFromTemplate(
  cues: SrtCue[],
  options?: Srt2FcpxOptions,
): string {
  const opts: Required<Srt2FcpxOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const { frameRate } = opts

  // Load templates
  const { baseTemplate, titleTemplate } = loadTemplates()

  // Calculate total sequence duration
  const maxEndMs = cues.length > 0 ? Math.max(...cues.map((c) => c.endMs)) : 0
  const totalDuration = millisecondsToFraction(maxEndMs, frameRate)

  // Build all title elements from template
  const titlesXml = cues
    .map((cue, index) =>
      buildTitleFromTemplate(cue, index, frameRate, titleTemplate),
    )
    .join('\n')

  // Replace placeholders in base template
  return baseTemplate
    .replace(/{SEQUENCE_DURATION}/g, totalDuration)
    .replace(/{TITLES}/g, titlesXml)
}
