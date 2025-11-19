/**
 * @srt2fcpx/core - Core library for SRT to FCPXML conversion
 */
import type { Srt2FcpxOptions, SrtCue, SrtParseResult } from "~/types";
export { DEFAULT_OPTIONS } from "~/types";
export type { Srt2FcpxOptions, SrtCue, SrtParseResult };
export { buildFcpxml, buildFcpxmlFromTemplate } from "~/fcpxml/builder";
export { formatSrtTimecode, parseSrt, stripHtmlTags } from "~/srt/parser";
/**
 * Convert SRT content to FCPXML
 * @param srtSource SRT file content as string
 * @param options Conversion options
 * @returns FCPXML string
 * @throws {Error} If SRT parsing fails
 */
export declare function convertSrtToFcpxml(srtSource: string, options?: Srt2FcpxOptions): string;
//# sourceMappingURL=index.d.ts.map