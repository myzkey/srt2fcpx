import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import type { Srt2FcpxOptions } from '@srt2fcpx/core'
import { convertSrtToFcpxml } from '@srt2fcpx/core'
import {
  type CliOptions,
  type ConfigFile,
  DEFAULT_CONFIG,
  mergeConfig,
} from './config.js'
import { logger } from './logger.js'

/**
 * CLI command options interface
 */
export interface CliCommandOptions {
  output?: string
  title: string
  fps: number
  width: number
  height: number
  font: string
  size: number
  face: string
  color: string
  bg: string
  strokeColor: string
  strokeWidth: number
  formatVersion: string
  config?: string
  quiet?: boolean
}

/**
 * Result of CLI operation
 */
export interface CliResult {
  success: boolean
  outputFile?: string
  error?: string
}

/**
 * Load config file from various locations
 * Priority: .srt2fcpxrc.json > srt2fcpx.config.json > ~/.srt2fcpxrc.json
 */
export function loadConfigFile(configPath?: string): ConfigFile | null {
  const configPaths = configPath
    ? [resolve(configPath)]
    : [
        resolve(process.cwd(), '.srt2fcpxrc.json'),
        resolve(process.cwd(), 'srt2fcpx.config.json'),
        join(homedir(), '.srt2fcpxrc.json'),
      ]

  for (const currentPath of configPaths) {
    if (existsSync(currentPath)) {
      try {
        const configContent = readFileSync(currentPath, 'utf-8')
        const config = JSON.parse(configContent) as ConfigFile
        logger.debug('⚙️  Config loaded from:', currentPath)
        return config
      } catch (error) {
        logger.warn('⚠️  Warning: Failed to parse config file:', currentPath)
        logger.warn(
          '   Error:',
          error instanceof Error ? error.message : String(error),
        )
      }
    }
  }

  if (configPath) {
    logger.warn('⚠️  Warning: Config file not found:', configPath)
  }

  return null
}

/**
 * Read and validate SRT file
 */
export function readSrtFile(inputPath: string): string {
  const resolvedPath = resolve(inputPath)

  if (!existsSync(resolvedPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  try {
    return readFileSync(resolvedPath, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to read input file: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Write FCPXML output file
 */
export function writeOutputFile(content: string, outputPath: string): void {
  const resolvedPath = resolve(outputPath)

  try {
    writeFileSync(resolvedPath, content, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to write output file: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Show applied options that differ from defaults
 */
export function showAppliedOptions(mergedOptions: CliOptions): void {
  const shownOptions: string[] = []

  if (mergedOptions.title !== DEFAULT_CONFIG.title)
    shownOptions.push(`title: ${mergedOptions.title}`)
  if (mergedOptions.fps !== DEFAULT_CONFIG.fps)
    shownOptions.push(`fps: ${mergedOptions.fps}`)
  if (mergedOptions.width !== DEFAULT_CONFIG.width)
    shownOptions.push(`width: ${mergedOptions.width}`)
  if (mergedOptions.height !== DEFAULT_CONFIG.height)
    shownOptions.push(`height: ${mergedOptions.height}`)
  if (mergedOptions.font !== DEFAULT_CONFIG.font)
    shownOptions.push(`font: ${mergedOptions.font}`)
  if (mergedOptions.size !== DEFAULT_CONFIG.size)
    shownOptions.push(`size: ${mergedOptions.size}`)
  if (mergedOptions.face !== DEFAULT_CONFIG.face)
    shownOptions.push(`face: ${mergedOptions.face}`)
  if (mergedOptions.color !== DEFAULT_CONFIG.color)
    shownOptions.push(`color: ${mergedOptions.color}`)
  if (mergedOptions.bg !== DEFAULT_CONFIG.bg)
    shownOptions.push(`bg: ${mergedOptions.bg}`)
  if (mergedOptions.strokeWidth !== DEFAULT_CONFIG.strokeWidth) {
    shownOptions.push(
      `stroke: ${mergedOptions.strokeColor} (width: ${mergedOptions.strokeWidth})`,
    )
  }
  if (mergedOptions.formatVersion !== DEFAULT_CONFIG.formatVersion)
    shownOptions.push(`format: ${mergedOptions.formatVersion}`)

  if (shownOptions.length > 0) {
    logger.debug('⚙️  Applied options:', shownOptions.join(', '))
  }
}

/**
 * Core CLI processing function
 */
export function processCliCommand(
  input: string,
  options: CliCommandOptions,
): CliResult {
  try {
    logger.info('📖 Reading:', input)

    // Load config file
    const config = loadConfigFile(options.config)

    // Read SRT file
    const srtContent = readSrtFile(input)

    // Merge config: CLI options > config file > defaults
    const cliOptions: CliOptions = {
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
    }

    const mergedOptions = mergeConfig(cliOptions, config)

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
    }

    // Convert
    const fcpxml = convertSrtToFcpxml(srtContent, conversionOptions)

    // Determine output file
    const outputFile = options.output || `${basename(input, '.srt')}.fcpxml`

    // Write output
    writeOutputFile(fcpxml, outputFile)

    logger.success('✅ Converted successfully!')
    logger.info('📝 Output:', outputFile)

    // Show applied options if different from defaults
    showAppliedOptions(mergedOptions)

    return {
      success: true,
      outputFile,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('❌ Error:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}