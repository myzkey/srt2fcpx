import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, basename, extname } from 'node:path';
import { Command } from 'commander';
import { convertSrtToFcpxml, parseSrt } from '@srt2fcpx/core';
import type { Srt2FcpxOptions, SrtCue } from '@srt2fcpx/core';

interface CliOptions {
  output?: string;
  titleName?: string;
  formatVersion?: string;
  frameRate?: number;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  lineSpacing?: number;
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

const program = new Command();

program
  .name('srt2fcpx')
  .description('Convert SRT subtitle files to Final Cut Pro FCPXML format')
  .version('0.1.0')
  .argument('<input>', 'Input SRT file path')
  .option('-o, --output <path>', 'Output FCPXML file path (default: stdout)')
  .option('-t, --title-name <name>', 'FCPXML project/sequence name')
  .option('--format-version <version>', 'FCPXML format version', '1.8')
  .option('--frame-rate <fps>', 'Timeline frame rate (e.g., 24, 25, 29.97, 30)', parseFloat)
  .option('--width <px>', 'Frame width in pixels', parseInt)
  .option('--height <px>', 'Frame height in pixels', parseInt)
  .option('--font-family <name>', 'Font family name')
  .option('--font-size <px>', 'Font size in pixels', parseInt)
  .option('--text-color <hex>', 'Text color (#RRGGBB or #RRGGBBAA)')
  .option('--bg-color <hex>', 'Background color (#RRGGBB or #RRGGBBAA)')
  .option('--line-spacing <value>', 'Line spacing', parseFloat)
  .option('--dry-run', 'Parse only, do not generate XML')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Suppress non-error output')
  .action(async (inputPath: string, cmdOptions: CliOptions) => {
    try {
      const {
        output,
        titleName,
        formatVersion,
        frameRate,
        width,
        height,
        fontFamily,
        fontSize,
        textColor,
        bgColor,
        lineSpacing,
        dryRun,
        verbose,
        quiet,
      } = cmdOptions;

      // Logging helpers
      const log = (msg: string) => {
        if (!quiet) console.log(msg);
      };
      const logVerbose = (msg: string) => {
        if (verbose && !quiet) console.log(msg);
      };
      const logError = (msg: string) => {
        console.error(msg);
      };

      // Check input file exists
      if (!existsSync(inputPath)) {
        logError(`Error: Input file not found: ${inputPath}`);
        process.exit(1);
      }

      logVerbose(`Reading input file: ${inputPath}`);

      // Read SRT file
      const srtContent = readFileSync(inputPath, 'utf-8');

      // Parse SRT
      logVerbose('Parsing SRT file...');
      const parseResult = parseSrt(srtContent);

      if (parseResult.errors.length > 0) {
        logVerbose('Parse warnings:');
        parseResult.errors.forEach((err: string) => logVerbose(`  - ${err}`));
      }

      log(`Parsed ${parseResult.cues.length} subtitle cues`);

      if (parseResult.cues.length === 0) {
        logError('Error: No valid subtitle cues found in input file');
        process.exit(1);
      }

      // Dry run mode
      if (dryRun) {
        log('\nDry run mode - showing parse results:');
        log(`  Total cues: ${parseResult.cues.length}`);
        log(`  Duration: ${parseResult.cues[parseResult.cues.length - 1].endMs / 1000}s`);
        log(`  Warnings: ${parseResult.errors.length}`);
        if (verbose) {
          parseResult.cues.slice(0, 5).forEach((cue: SrtCue) => {
            log(`\n  Cue #${cue.index}:`);
            log(`    Time: ${cue.startMs}ms - ${cue.endMs}ms`);
            log(`    Text: ${cue.text.substring(0, 50)}${cue.text.length > 50 ? '...' : ''}`);
          });
          if (parseResult.cues.length > 5) {
            log(`\n  ... and ${parseResult.cues.length - 5} more cues`);
          }
        }
        return;
      }

      // Build conversion options
      const options: Partial<Srt2FcpxOptions> = {};

      // Only add defined values
      if (titleName !== undefined) options.titleName = titleName;
      else options.titleName = basename(inputPath, extname(inputPath));
      if (formatVersion !== undefined) options.formatVersion = formatVersion;
      if (frameRate !== undefined) options.frameRate = frameRate;
      if (width !== undefined) options.width = width;
      if (height !== undefined) options.height = height;
      if (fontFamily !== undefined) options.fontFamily = fontFamily;
      if (fontSize !== undefined) options.fontSize = fontSize;
      if (textColor !== undefined) options.textColor = textColor;
      if (bgColor !== undefined) options.backgroundColor = bgColor;
      if (lineSpacing !== undefined) options.lineSpacing = lineSpacing;

      logVerbose('Converting to FCPXML...');

      // Convert to FCPXML
      const fcpxml = convertSrtToFcpxml(srtContent, options);

      // Output
      if (output) {
        // Ensure output directory exists
        const outputDir = dirname(output);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        writeFileSync(output, fcpxml, 'utf-8');
        log(`\nSuccess! FCPXML saved to: ${output}`);
      } else {
        // Write to stdout
        console.log(fcpxml);
      }

      logVerbose(`Conversion complete (${parseResult.cues.length} cues)`);
      process.exit(0);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
