import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { program } from 'commander';
import chalk from 'chalk';
import { convertSrtToFcpxml } from '@srt2fcpx/core';
import type { Srt2FcpxOptions } from '@srt2fcpx/core';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);

program
  .name('srt2fcpx')
  .description('Convert SRT subtitles to Final Cut Pro XML format')
  .version(packageJson.version)
  .argument('<input>', 'Input SRT file')
  .option('-o, --output <file>', 'Output FCPXML file (default: <input>.fcpxml)')
  .option('-t, --title <name>', 'Project title', 'Converted from SRT')
  .option('-f, --fps <number>', 'Frame rate', (val) => parseFloat(val), 24)
  .option('--width <number>', 'Video width', (val) => parseInt(val, 10), 1920)
  .option('--height <number>', 'Video height', (val) => parseInt(val, 10), 1080)
  .option('--font <name>', 'Font family', 'Helvetica')
  .option('--size <number>', 'Font size', (val) => parseInt(val, 10), 72)
  .option('--face <name>', 'Font face/weight (e.g., Regular, Bold, W8)', 'Regular')
  .option('--color <hex>', 'Text color (#RRGGBBAA)', '#FFFFFFFF')
  .option('--bg <hex>', 'Background color (#RRGGBBAA)', '#00000000')
  .option('--stroke-color <hex>', 'Stroke/outline color (#RRGGBBAA)', '#000000FF')
  .option('--stroke-width <number>', 'Stroke/outline width', (val) => parseInt(val, 10), 0)
  .option('--format-version <version>', 'FCPXML format version', '1.8')
  .action((input, options) => {
    try {
      console.log(chalk.blue('📖 Reading:'), input);

      // Read SRT file
      const srtContent = readFileSync(resolve(input), 'utf-8');

      // Build conversion options
      const conversionOptions: Srt2FcpxOptions = {
        titleName: options.title,
        frameRate: options.fps,
        width: options.width,
        height: options.height,
        fontFamily: options.font,
        fontSize: options.size,
        fontFace: options.face,
        textColor: options.color,
        backgroundColor: options.bg,
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth,
        formatVersion: options.formatVersion,
      };

      // Convert
      const fcpxml = convertSrtToFcpxml(srtContent, conversionOptions);

      // Determine output file
      const outputFile = options.output || `${basename(input, '.srt')}.fcpxml`;

      // Write output
      writeFileSync(resolve(outputFile), fcpxml, 'utf-8');

      console.log(chalk.green('✅ Converted successfully!'));
      console.log(chalk.blue('📝 Output:'), outputFile);

      // Show applied options if different from defaults
      const shownOptions: string[] = [];
      if (options.title !== 'Converted from SRT') shownOptions.push(`title: ${options.title}`);
      if (options.fps !== 24) shownOptions.push(`fps: ${options.fps}`);
      if (options.width !== 1920) shownOptions.push(`width: ${options.width}`);
      if (options.height !== 1080) shownOptions.push(`height: ${options.height}`);
      if (options.font !== 'Helvetica') shownOptions.push(`font: ${options.font}`);
      if (options.size !== 72) shownOptions.push(`size: ${options.size}`);
      if (options.face !== 'Regular') shownOptions.push(`face: ${options.face}`);
      if (options.color !== '#FFFFFFFF') shownOptions.push(`color: ${options.color}`);
      if (options.bg !== '#00000000') shownOptions.push(`bg: ${options.bg}`);
      if (options.strokeWidth !== 0) {
        shownOptions.push(`stroke: ${options.strokeColor} (width: ${options.strokeWidth})`);
      }
      if (options.formatVersion !== '1.8') shownOptions.push(`format: ${options.formatVersion}`);

      if (shownOptions.length > 0) {
        console.log(chalk.gray('⚙️  Options:'), shownOptions.join(', '));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
