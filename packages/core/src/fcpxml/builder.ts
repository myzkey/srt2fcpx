import { SrtCue, Srt2FcpxOptions, DEFAULT_OPTIONS } from '~/types';
import { stripHtmlTags } from '~/srt/parser';

/**
 * Convert milliseconds to FCPXML fraction format with frame alignment
 * @param ms Milliseconds
 * @param frameRate Frame rate (default: 24)
 * @returns FCPXML timecode (e.g., "72/24s")
 */
function millisecondsToFraction(ms: number, frameRate: number): string {
  const seconds = ms / 1000;
  // Round to frame boundary
  const frames = Math.floor(seconds * frameRate);
  return `${frames}/${frameRate}s`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build XML attributes string from key-value pairs
 * { font: "Hiragino", fontSize: 80 } -> font="Hiragino" fontSize="80"
 */
function buildAttributes(attrs: Record<string, string | number | boolean>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${String(value)}"`)
    .join(' ');
}

/**
 * Add indentation to each line of a string
 * @param lines String to indent
 * @param level Indentation level (each level = 2 spaces)
 * @returns Indented string
 */
function indent(lines: string, level: number): string {
  const pad = '  '.repeat(level);
  return lines
    .trim()
    .split('\n')
    .map(line => pad + line)
    .join('\n');
}

/**
 * Convert hex color (#RRGGBBAA) to FCPXML color format (r g b a)
 * @param hex Hex color string (#RRGGBB or #RRGGBBAA)
 * @returns FCPXML color string (e.g., "1 1 1 1")
 */
function hexToFcpxmlColor(hex: string): string {
  const clean = hex.replace(/^#/, '');

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = clean.length === 8 ? parseInt(clean.substring(6, 8), 16) / 255 : 1;

  return `${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)} ${a.toFixed(6)}`;
}

/**
 * 1つの SRT キューを <title> 要素に変換
 */
function buildTitleXml(
  cue: SrtCue,
  index: number,
  frameRate: number,
  opts: Required<Srt2FcpxOptions>,
  textColor: string,
  backgroundColor: string
): string {
  const offset = millisecondsToFraction(cue.startMs, frameRate);
  const duration = millisecondsToFraction(cue.endMs - cue.startMs, frameRate);

  // Strip HTML tags from text (v0.1 ignores style tags)
  const cleanText = stripHtmlTags(cue.text);
  const text = escapeXml(cleanText);

  // Create abbreviated title for clip name
  const titlePreview = text.substring(0, 20).replace(/\n/g, ' ');
  const titleName = text.length > 20 ? `${titlePreview}...` : titlePreview;

  const styleId = `ts${index + 1}`;

  const textStyleAttrs = buildAttributes({
    font: opts.fontFamily,
    fontSize: opts.fontSize,
    fontFace: 'Regular',
    fontColor: textColor,
    backgroundColor,
    alignment: 'center',
  });

  // Preserve newlines in text content by using placeholder
  const NEWLINE_PLACEHOLDER = '___NEWLINE___';
  const textWithPlaceholder = text.replace(/\n/g, NEWLINE_PLACEHOLDER);

  const xml = `
<title name="Basic Title: ${titleName}" offset="${offset}" ref="r2" duration="${duration}" start="${offset}">
  <text>
    <text-style ref="${styleId}">${textWithPlaceholder}</text-style>
  </text>
  <text-style-def id="${styleId}">
    <text-style ${textStyleAttrs}/>
  </text-style-def>
</title>`;

  // spine 内でのインデントレベルをここで調整
  const indented = indent(xml, 6); // "            " (12 spaces) 相当

  // Restore newlines in text content
  return indented.replace(new RegExp(NEWLINE_PLACEHOLDER, 'g'), '\n');
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
  };

  const {
    frameRate,
    width,
    height,
    titleName,
    textColor: textColorHex,
    backgroundColor: backgroundHex,
    formatVersion,
  } = opts;

  const maxEndMs = cues.length > 0 ? Math.max(...cues.map(c => c.endMs)) : 0;
  const totalDuration = millisecondsToFraction(maxEndMs, frameRate);

  const textColor = hexToFcpxmlColor(textColorHex);
  const backgroundColor = hexToFcpxmlColor(backgroundHex);

  const escapedTitle = escapeXml(titleName);

  const titlesXml = cues
    .map((cue, index) =>
      buildTitleXml(cue, index, frameRate, opts, textColor, backgroundColor)
    )
    .join('\n');

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
</fcpxml>`;
}
