/**
 * srt2fcpx - Convert SRT subtitle files to Final Cut Pro FCPXML format
 *
 * This package re-exports everything from @srt2fcpx/core for unified user experience.
 * Users can:
 * - Use CLI: npx srt2fcpx input.srt -o output.fcpxml
 * - Use as library: import { convertSrtToFcpxml } from 'srt2fcpx'
 */

// Re-export everything from core
export * from '@srt2fcpx/core'
