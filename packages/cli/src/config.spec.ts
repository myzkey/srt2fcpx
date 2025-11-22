import { describe, expect, it } from 'vitest'
import {
  type CliOptions,
  type ConfigFile,
  DEFAULT_CONFIG,
  mergeConfig,
} from './config'

describe('Config merging', () => {
  // Helper to create CLI options with defaults
  const createCliOptions = (
    overrides: Partial<CliOptions> = {},
  ): CliOptions => ({
    title: DEFAULT_CONFIG.title,
    fps: DEFAULT_CONFIG.fps,
    width: DEFAULT_CONFIG.width,
    height: DEFAULT_CONFIG.height,
    font: DEFAULT_CONFIG.font,
    size: DEFAULT_CONFIG.size,
    face: DEFAULT_CONFIG.face,
    color: DEFAULT_CONFIG.color,
    bg: DEFAULT_CONFIG.bg,
    strokeColor: DEFAULT_CONFIG.strokeColor,
    strokeWidth: DEFAULT_CONFIG.strokeWidth,
    formatVersion: DEFAULT_CONFIG.formatVersion,
    ...overrides,
  })

  describe('Without config file', () => {
    it('should return CLI options when no config file is provided', () => {
      const cliOptions = createCliOptions()
      const result = mergeConfig(cliOptions, null)

      expect(result).toEqual(cliOptions)
    })

    it('should return CLI options when config file is undefined', () => {
      const cliOptions = createCliOptions({ title: 'Custom Title', fps: 30 })
      const result = mergeConfig(cliOptions, undefined)

      expect(result).toEqual(cliOptions)
    })
  })

  describe('With config file', () => {
    it('should use config file values when CLI options are at defaults', () => {
      const cliOptions = createCliOptions() // All defaults
      const configFile: ConfigFile = {
        title: 'Config Title',
        fps: 30,
        font: 'Arial',
        size: 100,
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result).toEqual({
        ...cliOptions,
        title: 'Config Title',
        fps: 30,
        font: 'Arial',
        size: 100,
      })
    })

    it('should prioritize CLI options over config file values', () => {
      const cliOptions = createCliOptions({
        title: 'CLI Title',
        fps: 60,
      })
      const configFile: ConfigFile = {
        title: 'Config Title', // Should be ignored
        fps: 30, // Should be ignored
        font: 'Arial', // Should be applied (CLI has default)
        size: 100, // Should be applied (CLI has default)
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result).toEqual({
        ...createCliOptions(),
        title: 'CLI Title', // From CLI
        fps: 60, // From CLI
        font: 'Arial', // From config (CLI was default)
        size: 100, // From config (CLI was default)
      })
    })

    it('should handle all config file options', () => {
      const cliOptions = createCliOptions() // All defaults
      const configFile: ConfigFile = {
        title: 'Full Config',
        fps: 30,
        width: 1280,
        height: 720,
        font: 'Arial',
        size: 90,
        face: 'Bold',
        color: '#FF0000FF',
        bg: '#00FF00FF',
        strokeColor: '#0000FFFF',
        strokeWidth: 5,
        formatVersion: '1.13',
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result).toEqual(configFile)
    })
  })

  describe('Special cases', () => {
    it('should handle strokeWidth = 0 from config file', () => {
      const cliOptions = createCliOptions({ strokeWidth: 5 }) // Non-default
      const configFile: ConfigFile = {
        strokeWidth: 0, // Should be ignored (CLI is not default)
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result.strokeWidth).toBe(5) // CLI value preserved
    })

    it('should apply strokeWidth = 0 when CLI is at default', () => {
      const cliOptions = createCliOptions() // strokeWidth = 0 (default)
      const configFile: ConfigFile = {
        strokeWidth: 0, // Should be applied (CLI is at default, config !== undefined)
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result.strokeWidth).toBe(0) // Config value applied
    })

    it('should handle negative strokeWidth from config file', () => {
      const cliOptions = createCliOptions() // strokeWidth = 0 (default)
      const configFile: ConfigFile = {
        strokeWidth: -8, // Should be applied
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result.strokeWidth).toBe(-8)
    })

    it('should ignore strokeWidth = undefined in config file', () => {
      const cliOptions = createCliOptions() // strokeWidth = 0 (default)
      const configFile: ConfigFile = {
        strokeWidth: undefined, // Should be ignored
        title: 'Test Title', // Should be applied
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result.strokeWidth).toBe(0) // Default preserved
      expect(result.title).toBe('Test Title') // Config applied
    })

    it('should handle falsy values in config file (except strokeWidth)', () => {
      const cliOptions = createCliOptions() // All defaults
      const configFile: ConfigFile = {
        title: '', // Falsy - should be ignored
        fps: 0, // Falsy - should be ignored
        size: 0, // Falsy - should be ignored
        face: '', // Falsy - should be ignored
        font: 'Arial', // Truthy - should be applied
        strokeWidth: 0, // Special case - should be applied
      }

      const result = mergeConfig(cliOptions, configFile)

      // Only font and strokeWidth should be applied
      expect(result).toEqual({
        ...createCliOptions(),
        font: 'Arial',
        strokeWidth: 0,
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty config file object', () => {
      const cliOptions = createCliOptions({ title: 'CLI Title' })
      const configFile: ConfigFile = {}

      const result = mergeConfig(cliOptions, configFile)

      expect(result).toEqual(cliOptions)
    })

    it('should handle partial config file', () => {
      const cliOptions = createCliOptions()
      const configFile: ConfigFile = {
        fps: 25,
        // Missing other properties
      }

      const result = mergeConfig(cliOptions, configFile)

      expect(result).toEqual({
        ...createCliOptions(),
        fps: 25,
      })
    })

    it('should handle all CLI options being non-default', () => {
      const cliOptions = createCliOptions({
        title: 'CLI Title',
        fps: 60,
        width: 1280,
        height: 720,
        font: 'Custom Font',
        size: 90,
        face: 'Bold',
        color: '#FF0000FF',
        bg: '#00FF00FF',
        strokeColor: '#0000FFFF',
        strokeWidth: 10,
        formatVersion: '1.13',
      })
      const configFile: ConfigFile = {
        title: 'Config Title',
        fps: 30,
        // All other values should be ignored
      }

      const result = mergeConfig(cliOptions, configFile)

      // No config values should be applied (all CLI values are non-default)
      expect(result).toEqual(cliOptions)
    })
  })

  describe('Type safety', () => {
    it('should maintain type safety with valid inputs', () => {
      const cliOptions = createCliOptions()
      const configFile: ConfigFile = { fps: 30 }

      const result = mergeConfig(cliOptions, configFile)

      // TypeScript should ensure all required properties exist
      expect(typeof result.title).toBe('string')
      expect(typeof result.fps).toBe('number')
      expect(typeof result.width).toBe('number')
      expect(typeof result.height).toBe('number')
      expect(typeof result.font).toBe('string')
      expect(typeof result.size).toBe('number')
      expect(typeof result.face).toBe('string')
      expect(typeof result.color).toBe('string')
      expect(typeof result.bg).toBe('string')
      expect(typeof result.strokeColor).toBe('string')
      expect(typeof result.strokeWidth).toBe('number')
      expect(typeof result.formatVersion).toBe('string')
    })
  })
})
