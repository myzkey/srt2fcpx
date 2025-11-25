/**
 * @srt2fcpx/core - Core library for SRT to FCPXML conversion
 */

import { buildFcpxmlFromTemplate } from '~/fcpxml/builder'
import { parseSrt } from '~/srt/parser'
import type { Srt2FcpxOptions, SrtCue, SrtParseResult } from '~/types'

// Export types
export { DEFAULT_OPTIONS } from '~/types'
export type { Srt2FcpxOptions, SrtCue, SrtParseResult }

// Export functions
export { buildFcpxml, buildFcpxmlFromTemplate } from '~/fcpxml/builder'
export {
  decodeHtmlEntities,
  formatSrtTimecode,
  parseSrt,
  stripHtmlTags,
} from '~/srt/parser'

/**
 * Convert SRT content to FCPXML
 * @param srtSource SRT file content as string
 * @param options Conversion options
 * @returns FCPXML string
 * @throws {Error} If SRT parsing fails
 */
export function convertSrtToFcpxml(
  srtSource: string,
  options?: Srt2FcpxOptions,
): string {
  // Parse SRT
  const parseResult = parseSrt(srtSource)

  // Check for fatal errors
  if (parseResult.cues.length === 0) {
    throw new Error('No valid SRT cues found in input')
  }

  // Build FCPXML using template-based approach
  const fcpxml = buildFcpxmlFromTemplate(parseResult.cues, options)

  return fcpxml
}
