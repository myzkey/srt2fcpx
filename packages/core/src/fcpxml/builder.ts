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
 * Convert hex color (#RRGGBBAA) to FCPXML color format (r g b a)
 * @param hex Hex color string (#RRGGBB or #RRGGBBAA)
 * @returns FCPXML color string (e.g., "1 1 1 1")
 */
function hexToFcpxmlColor(hex: string): string {
  // Remove # prefix
  const clean = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = clean.length === 8 ? parseInt(clean.substring(6, 8), 16) / 255 : 1;

  // Format as space-separated decimal values
  return `${r.toFixed(6)} ${g.toFixed(6)} ${b.toFixed(6)} ${a.toFixed(6)}`;
}

/**
 * Build FCPXML from SRT cues
 * @param cues Parsed SRT cues
 * @param options Conversion options
 * @returns FCPXML string
 */
export function buildFcpxml(cues: SrtCue[], options?: Srt2FcpxOptions): string {
  // Merge options with defaults
  const opts: Required<Srt2FcpxOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const frameRate = opts.frameRate;

  // Calculate total duration
  const maxEndMs = cues.length > 0 ? Math.max(...cues.map(c => c.endMs)) : 0;
  const totalDuration = millisecondsToFraction(maxEndMs, frameRate);

  // Convert colors
  const textColor = hexToFcpxmlColor(opts.textColor);
  const backgroundColor = hexToFcpxmlColor(opts.backgroundColor);

  // Build FCPXML header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="${opts.formatVersion}">
  <resources>
    <format id="r1" name="FFVideoFormat${opts.height}p${frameRate}" frameDuration="1/${frameRate}s" width="${opts.width}" height="${opts.height}"/>
    <effect id="r2" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>
  </resources>

  <library>
    <event name="${escapeXml(opts.titleName)}">
      <project name="${escapeXml(opts.titleName)}">
        <sequence format="r1" duration="${totalDuration}" tcStart="0s" tcFormat="NDF">
          <spine>
`;

  // Add title clips for each cue
  cues.forEach((cue, index) => {
    const offset = millisecondsToFraction(cue.startMs, frameRate);
    const duration = millisecondsToFraction(cue.endMs - cue.startMs, frameRate);

    // Strip HTML tags from text (v0.1 ignores style tags)
    const cleanText = stripHtmlTags(cue.text);
    const text = escapeXml(cleanText);

    // Create abbreviated title for clip name
    const titlePreview = text.substring(0, 20).replace(/\n/g, ' ');
    const titleName = text.length > 20 ? `${titlePreview}...` : titlePreview;

    const styleId = `ts${index + 1}`;

    // Build text-style attributes
    const textStyleAttrs = `font="${opts.fontFamily}" fontSize="${opts.fontSize}" fontFace="Regular" fontColor="${textColor}" backgroundColor="${backgroundColor}" alignment="center"`;

    xml += `            <title name="Basic Title: ${titleName}" offset="${offset}" ref="r2" duration="${duration}" start="${offset}">
              <text>
                <text-style ref="${styleId}">${text}</text-style>
              </text>
              <text-style-def id="${styleId}">
                <text-style ${textStyleAttrs}/>
              </text-style-def>
            </title>
`;
  });

  // Close FCPXML
  xml += `          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;

  return xml;
}
