/**
 * @srt2fcpx/core - Core library for SRT to FCPXML conversion
 */

import { parseSrt } from './srt/parser';
import { buildFcpxml } from './fcpxml/builder';
import type { Srt2FcpxOptions, SrtCue, SrtParseResult } from './types';

// Export types
export type { Srt2FcpxOptions, SrtCue, SrtParseResult };
export { DEFAULT_OPTIONS } from './types';

// Export functions
export { parseSrt, formatSrtTimecode, stripHtmlTags } from './srt/parser';
export { buildFcpxml } from './fcpxml/builder';

/**
 * Convert SRT content to FCPXML
 * @param srtSource SRT file content as string
 * @param options Conversion options
 * @returns FCPXML string
 * @throws {Error} If SRT parsing fails
 */
export function convertSrtToFcpxml(
  srtSource: string,
  options?: Srt2FcpxOptions
): string {
  // Parse SRT
  const parseResult = parseSrt(srtSource);

  // Check for fatal errors
  if (parseResult.cues.length === 0) {
    throw new Error('No valid SRT cues found in input');
  }

  // Build FCPXML
  const fcpxml = buildFcpxml(parseResult.cues, options);

  return fcpxml;
}
