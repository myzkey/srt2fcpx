import { readFileSync } from 'node:fs'
import { program } from 'commander'
import { type CliCommandOptions, processCliCommand } from './cli-core.js'
import { setQuiet } from './logger.js'

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
)

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
  .option(
    '--face <name>',
    'Font face/weight (e.g., Regular, Bold, W8)',
    'Regular',
  )
  .option('--color <hex>', 'Text color (#RRGGBBAA)', '#FFFFFFFF')
  .option('--bg <hex>', 'Background color (#RRGGBBAA)', '#00000000')
  .option(
    '--stroke-color <hex>',
    'Stroke/outline color (#RRGGBBAA)',
    '#000000FF',
  )
  .option(
    '--stroke-width <number>',
    'Stroke/outline width',
    (val) => parseInt(val, 10),
    0,
  )
  .option('--format-version <version>', 'FCPXML format version', '1.8')
  .option('--config <file>', 'Path to config file (overrides auto-discovery)')
  .option('-q, --quiet', 'Suppress all output except errors')
  .action((input, options) => {
    // Set quiet mode before any logging
    if (options.quiet) {
      setQuiet(true)
    }

    // Process the CLI command using the extracted core logic
    const result = processCliCommand(input, options as CliCommandOptions)

    if (!result.success) {
      process.exit(1)
    }
  })

program.parse()
