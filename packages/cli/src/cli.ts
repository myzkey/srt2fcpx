import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';
import { homedir } from 'node:os';
import { program } from 'commander';
import { convertSrtToFcpxml } from '@srt2fcpx/core';
import type { Srt2FcpxOptions } from '@srt2fcpx/core';
import { logger, setQuiet } from './logger.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
);

/**
 * Config file interface
 */
interface ConfigFile {
  title?: string;
  fps?: number;
  width?: number;
  height?: number;
  font?: string;
  size?: number;
  face?: string;
  color?: string;
  bg?: string;
  strokeColor?: string;
  strokeWidth?: number;
  formatVersion?: string;
}

/**
 * Load config file from various locations
 * Priority: .srt2fcpxrc.json > srt2fcpx.config.json > ~/.srt2fcpxrc.json
 */
function loadConfigFile(): ConfigFile | null {
  const configPaths = [
    resolve(process.cwd(), '.srt2fcpxrc.json'),
    resolve(process.cwd(), 'srt2fcpx.config.json'),
    join(homedir(), '.srt2fcpxrc.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configContent) as ConfigFile;
        logger.debug('⚙️  Config loaded from:', configPath);
        return config;
      } catch (error) {
        logger.warn('⚠️  Warning: Failed to parse config file:', configPath);
        logger.warn('   Error:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  return null;
}

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
  .option('--config <file>', 'Path to config file (overrides auto-discovery)')
  .option('-q, --quiet', 'Suppress all output except errors')
  .action((input, options) => {
    // Set quiet mode before any logging
    if (options.quiet) {
      setQuiet(true);
    }
    try {
      logger.info('📖 Reading:', input);

      // Load config file
      let config: ConfigFile | null = null;
      if (options.config) {
        // Load from specified config file
        const configPath = resolve(options.config);
        if (existsSync(configPath)) {
          try {
            const configContent = readFileSync(configPath, 'utf-8');
            config = JSON.parse(configContent) as ConfigFile;
            logger.debug('⚙️  Config loaded from:', configPath);
          } catch (error) {
            logger.warn('⚠️  Warning: Failed to parse config file:', configPath);
            logger.warn('   Error:', error instanceof Error ? error.message : String(error));
          }
        } else {
          logger.warn('⚠️  Warning: Config file not found:', configPath);
        }
      } else {
        // Auto-discover config file
        config = loadConfigFile();
      }

      // Read SRT file
      const srtContent = readFileSync(resolve(input), 'utf-8');

      // Merge config: CLI options > config file > defaults
      // Commander sets default values, so we need to check if values were explicitly provided
      const mergedOptions = {
        title: options.title,
        fps: options.fps,
        width: options.width,
        height: options.height,
        font: options.font,
        size: options.size,
        face: options.face,
        color: options.color,
        bg: options.bg,
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth,
        formatVersion: options.formatVersion,
      };

      // Apply config file values if CLI options are at their defaults
      if (config) {
        const defaults = {
          title: 'Converted from SRT',
          fps: 24,
          width: 1920,
          height: 1080,
          font: 'Helvetica',
          size: 72,
          face: 'Regular',
          color: '#FFFFFFFF',
          bg: '#00000000',
          strokeColor: '#000000FF',
          strokeWidth: 0,
          formatVersion: '1.8',
        };

        if (mergedOptions.title === defaults.title && config.title) mergedOptions.title = config.title;
        if (mergedOptions.fps === defaults.fps && config.fps) mergedOptions.fps = config.fps;
        if (mergedOptions.width === defaults.width && config.width) mergedOptions.width = config.width;
        if (mergedOptions.height === defaults.height && config.height) mergedOptions.height = config.height;
        if (mergedOptions.font === defaults.font && config.font) mergedOptions.font = config.font;
        if (mergedOptions.size === defaults.size && config.size) mergedOptions.size = config.size;
        if (mergedOptions.face === defaults.face && config.face) mergedOptions.face = config.face;
        if (mergedOptions.color === defaults.color && config.color) mergedOptions.color = config.color;
        if (mergedOptions.bg === defaults.bg && config.bg) mergedOptions.bg = config.bg;
        if (mergedOptions.strokeColor === defaults.strokeColor && config.strokeColor) mergedOptions.strokeColor = config.strokeColor;
        if (mergedOptions.strokeWidth === defaults.strokeWidth && config.strokeWidth !== undefined) mergedOptions.strokeWidth = config.strokeWidth;
        if (mergedOptions.formatVersion === defaults.formatVersion && config.formatVersion) mergedOptions.formatVersion = config.formatVersion;
      }

      // Build conversion options
      const conversionOptions: Srt2FcpxOptions = {
        titleName: mergedOptions.title,
        frameRate: mergedOptions.fps,
        width: mergedOptions.width,
        height: mergedOptions.height,
        fontFamily: mergedOptions.font,
        fontSize: mergedOptions.size,
        fontFace: mergedOptions.face,
        textColor: mergedOptions.color,
        backgroundColor: mergedOptions.bg,
        strokeColor: mergedOptions.strokeColor,
        strokeWidth: mergedOptions.strokeWidth,
        formatVersion: mergedOptions.formatVersion,
      };

      // Convert
      const fcpxml = convertSrtToFcpxml(srtContent, conversionOptions);

      // Determine output file
      const outputFile = options.output || `${basename(input, '.srt')}.fcpxml`;

      // Write output
      writeFileSync(resolve(outputFile), fcpxml, 'utf-8');

      logger.success('✅ Converted successfully!');
      logger.info('📝 Output:', outputFile);

      // Show applied options if different from defaults
      const shownOptions: string[] = [];
      if (mergedOptions.title !== 'Converted from SRT') shownOptions.push(`title: ${mergedOptions.title}`);
      if (mergedOptions.fps !== 24) shownOptions.push(`fps: ${mergedOptions.fps}`);
      if (mergedOptions.width !== 1920) shownOptions.push(`width: ${mergedOptions.width}`);
      if (mergedOptions.height !== 1080) shownOptions.push(`height: ${mergedOptions.height}`);
      if (mergedOptions.font !== 'Helvetica') shownOptions.push(`font: ${mergedOptions.font}`);
      if (mergedOptions.size !== 72) shownOptions.push(`size: ${mergedOptions.size}`);
      if (mergedOptions.face !== 'Regular') shownOptions.push(`face: ${mergedOptions.face}`);
      if (mergedOptions.color !== '#FFFFFFFF') shownOptions.push(`color: ${mergedOptions.color}`);
      if (mergedOptions.bg !== '#00000000') shownOptions.push(`bg: ${mergedOptions.bg}`);
      if (mergedOptions.strokeWidth !== 0) {
        shownOptions.push(`stroke: ${mergedOptions.strokeColor} (width: ${mergedOptions.strokeWidth})`);
      }
      if (mergedOptions.formatVersion !== '1.8') shownOptions.push(`format: ${mergedOptions.formatVersion}`);

      if (shownOptions.length > 0) {
        logger.debug('⚙️  Applied options:', shownOptions.join(', '));
      }

    } catch (error) {
      logger.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
