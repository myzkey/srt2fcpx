/**
 * Options for SRT to FCPXML conversion
 */
export interface Srt2FcpxOptions {
  /** FCPXML project/sequence name */
  titleName?: string;

  /** FCPXML format version (e.g., "1.8") */
  formatVersion?: string;

  /** Timeline frame rate (e.g., 23.976, 24, 25, 29.97, 30) */
  frameRate?: number;

  /** Frame width in pixels (default: 1920) */
  width?: number;

  /** Frame height in pixels (default: 1080) */
  height?: number;

  /** Font family name */
  fontFamily?: string;

  /** Font size in pixels */
  fontSize?: number;

  /** Font face/weight (e.g., "Regular", "Bold", "W8") */
  fontFace?: string;

  /** Text color in #RRGGBB or #RRGGBBAA format */
  textColor?: string;

  /** Background color in #RRGGBB or #RRGGBBAA format */
  backgroundColor?: string;

  /** Stroke (outline) color in #RRGGBB or #RRGGBBAA format */
  strokeColor?: string;

  /** Stroke (outline) width in pixels */
  strokeWidth?: number;

  /** Line spacing */
  lineSpacing?: number;
}

/**
 * Represents a single SRT subtitle cue
 */
export interface SrtCue {
  /** Sequential index of the cue */
  index: number;

  /** Start time in milliseconds */
  startMs: number;

  /** End time in milliseconds */
  endMs: number;

  /** Subtitle text (may contain newlines) */
  text: string;
}

/**
 * Result of parsing an SRT file
 */
export interface SrtParseResult {
  /** Parsed subtitle cues */
  cues: SrtCue[];

  /** Recoverable parse errors/warnings */
  errors: string[];
}

/**
 * Default options for conversion
 */
export const DEFAULT_OPTIONS: Required<Srt2FcpxOptions> = {
  titleName: "Converted from SRT",
  formatVersion: "1.8",
  frameRate: 24,
  width: 1920,
  height: 1080,
  fontFamily: "Helvetica",
  fontSize: 72,
  fontFace: "Regular",
  textColor: "#FFFFFFFF",
  backgroundColor: "#00000000",
  strokeColor: "#000000FF",
  strokeWidth: 0,
  lineSpacing: 1.0,
};
