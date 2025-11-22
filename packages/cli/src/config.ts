/**
 * Configuration file interface
 */
export interface ConfigFile {
  title?: string
  fps?: number
  width?: number
  height?: number
  font?: string
  size?: number
  face?: string
  color?: string
  bg?: string
  strokeColor?: string
  strokeWidth?: number
  formatVersion?: string
}

/**
 * CLI options interface (matches Commander options)
 */
export interface CliOptions {
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
}

/**
 * Default values for all configuration options
 */
export const DEFAULT_CONFIG = {
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
} as const

/**
 * Merge CLI options with config file values and defaults
 * Priority: CLI options > config file > defaults
 *
 * @param cliOptions Options from Commander CLI
 * @param configFile Config file values (optional)
 * @returns Merged configuration options
 */
export function mergeConfig(
  cliOptions: CliOptions,
  configFile?: ConfigFile | null,
): CliOptions {
  const defaults = DEFAULT_CONFIG

  const mergedOptions = {
    title: cliOptions.title,
    fps: cliOptions.fps,
    width: cliOptions.width,
    height: cliOptions.height,
    font: cliOptions.font,
    size: cliOptions.size,
    face: cliOptions.face,
    color: cliOptions.color,
    bg: cliOptions.bg,
    strokeColor: cliOptions.strokeColor,
    strokeWidth: cliOptions.strokeWidth,
    formatVersion: cliOptions.formatVersion,
  }

  // Apply config file values if CLI options are at their defaults
  if (configFile) {
    // Special handling for strokeWidth (check for !== undefined)
    const specialCases = new Set(['strokeWidth'])

    for (const [key, defaultValue] of Object.entries(defaults)) {
      const configKey = key as keyof ConfigFile
      const configValue = configFile[configKey]
      const mergedKey = key as keyof typeof mergedOptions

      // Special case for strokeWidth: check !== undefined instead of truthy
      if (specialCases.has(key)) {
        if (
          mergedOptions[mergedKey] === defaultValue &&
          configValue !== undefined
        ) {
          ;(mergedOptions as Record<string, unknown>)[mergedKey] = configValue
        }
      } else {
        // Standard case: check if config value is truthy
        if (mergedOptions[mergedKey] === defaultValue && configValue) {
          ;(mergedOptions as Record<string, unknown>)[mergedKey] = configValue
        }
      }
    }
  }

  return mergedOptions
}
