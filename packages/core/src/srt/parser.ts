import { SrtCue, SrtParseResult } from '~/types';

/**
 * Parse SRT subtitle file content
 * @param source SRT file content as string
 * @returns Parsed cues and any errors encountered
 */
export function parseSrt(source: string): SrtParseResult {
  const cues: SrtCue[] = [];
  const errors: string[] = [];

  // Normalize line endings and split into blocks
  const normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      errors.push(`Skipping incomplete block: ${block.substring(0, 50)}`);
      continue;
    }

    try {
      // Parse index (first line)
      const indexLine = lines[0].trim();
      const index = parseInt(indexLine, 10);

      if (isNaN(index)) {
        errors.push(`Invalid index: ${indexLine}`);
        continue;
      }

      // Parse timecode (second line)
      const timecodeLine = lines[1].trim();
      const timecodeMatch = timecodeLine.match(
        /^(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})$/
      );

      if (!timecodeMatch) {
        errors.push(`Invalid timecode format: ${timecodeLine}`);
        continue;
      }

      const [, startH, startM, startS, startMs, endH, endM, endS, endMs] = timecodeMatch;

      const startTime = parseTimecode(
        parseInt(startH),
        parseInt(startM),
        parseInt(startS),
        parseInt(startMs)
      );

      const endTime = parseTimecode(
        parseInt(endH),
        parseInt(endM),
        parseInt(endS),
        parseInt(endMs)
      );

      if (endTime <= startTime) {
        errors.push(
          `End time must be after start time in cue ${index}: ${timecodeLine}`
        );
        continue;
      }

      // Parse text (remaining lines)
      const text = lines.slice(2).join('\n').trim();

      if (!text) {
        errors.push(`Empty text in cue ${index}`);
      }

      cues.push({
        index,
        startMs: startTime,
        endMs: endTime,
        text,
      });
    } catch (error) {
      errors.push(
        `Error parsing block: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return { cues, errors };
}

/**
 * Convert hours, minutes, seconds, and milliseconds to total milliseconds
 */
function parseTimecode(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number
): number {
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

/**
 * Convert milliseconds to SRT timecode format (HH:MM:SS,mmm)
 */
export function formatSrtTimecode(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(milliseconds, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

/**
 * Strip HTML-like tags from text (for v0.1, we ignore style tags)
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}
