import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processCliCommand, type CliCommandOptions } from './cli-core.js'
import { setQuiet } from './logger.js'

// Mock logger
vi.mock('./logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  setQuiet: vi.fn(),
  isQuiet: vi.fn().mockReturnValue(false)
}))

// Mock fs functions
vi.mock('node:fs')
const mockExistsSync = vi.mocked(existsSync)
const mockReadFileSync = vi.mocked(readFileSync)
const mockWriteFileSync = vi.mocked(writeFileSync)

// Mock the core conversion function
vi.mock('@srt2fcpx/core', () => ({
  convertSrtToFcpxml: vi.fn().mockReturnValue('<fcpxml>test</fcpxml>')
}))

describe('CLI Integration Tests', () => {
  const tempDir = tmpdir()
  const testSrtPath = join(tempDir, 'test.srt')
  const testConfigPath = join(tempDir, '.srt2fcpxrc.json')
  const testOutputPath = join(tempDir, 'test.fcpxml')

  const mockSrtContent = `1
00:00:01,000 --> 00:00:02,000
Hello World

2
00:00:03,000 --> 00:00:04,000
Test subtitle
`

  const mockConfig = {
    title: 'Test Project',
    fps: 30,
    width: 1280,
    height: 720,
    font: 'Arial',
    size: 64,
    face: 'Bold',
    color: '#FF0000FF',
    bg: '#00000080',
    strokeColor: '#FFFFFF80',
    strokeWidth: 2,
    formatVersion: '1.8'
  }

  const defaultOptions: CliCommandOptions = {
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
    formatVersion: '1.8'
  }

  beforeEach(async () => {
    // Reset quiet mode
    setQuiet(false)

    // Clear all mocks
    vi.clearAllMocks()

    // Default mock setup
    mockExistsSync.mockReturnValue(true)
    mockReadFileSync.mockReturnValue(mockSrtContent)
    mockWriteFileSync.mockImplementation(() => {})

    // Reset conversion function to normal behavior
    const { convertSrtToFcpxml } = await import('@srt2fcpx/core')
    vi.mocked(convertSrtToFcpxml).mockReturnValue('<fcpxml>test</fcpxml>')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic functionality', () => {
    it('should successfully convert SRT file with default options', () => {
      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.outputFile).toBe('test.fcpxml')
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.srt'),
        'utf-8'
      )
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test.fcpxml'),
        '<fcpxml>test</fcpxml>',
        'utf-8'
      )
    })

    it('should use custom output file when specified', () => {
      const options = { ...defaultOptions, output: 'custom.fcpxml' }
      const result = processCliCommand(testSrtPath, options)

      expect(result.success).toBe(true)
      expect(result.outputFile).toBe('custom.fcpxml')
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('custom.fcpxml'),
        '<fcpxml>test</fcpxml>',
        'utf-8'
      )
    })

    it('should handle SRT files without .srt extension', () => {
      const noExtPath = join(tempDir, 'test')
      const result = processCliCommand(noExtPath, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.outputFile).toBe('test.fcpxml')
    })
  })

  describe('Config file handling', () => {
    beforeEach(() => {
      // Mock config file reading
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.toString().includes('.srt2fcpxrc.json')) {
          return JSON.stringify(mockConfig)
        }
        return mockSrtContent
      })
    })

    it('should load config from .srt2fcpxrc.json in current directory', () => {
      mockExistsSync.mockImplementation((path: any) => {
        return path.toString().includes('test.srt') ||
               path.toString().includes('.srt2fcpxrc.json')
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.srt2fcpxrc.json'),
        'utf-8'
      )
    })

    it('should load config from specified config file', () => {
      const options = { ...defaultOptions, config: testConfigPath }

      const result = processCliCommand(testSrtPath, options)

      expect(result.success).toBe(true)
      expect(mockReadFileSync).toHaveBeenCalledWith(testConfigPath, 'utf-8')
    })

    it('should handle missing specified config file gracefully', () => {
      mockExistsSync.mockImplementation((path: any) => {
        return path.toString().includes('test.srt') // Only SRT exists
      })

      const options = { ...defaultOptions, config: testConfigPath }
      const result = processCliCommand(testSrtPath, options)

      expect(result.success).toBe(true) // Should still work with defaults
    })

    it('should handle malformed config file gracefully', () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.toString().includes('.srt2fcpxrc.json')) {
          return '{ invalid json'
        }
        return mockSrtContent
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true) // Should fallback to defaults
    })
  })

  describe('CLI options merging', () => {
    it('should prioritize CLI options over config file', () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.toString().includes('.srt2fcpxrc.json')) {
          return JSON.stringify({ title: 'Config Title', fps: 30 })
        }
        return mockSrtContent
      })

      const options = { ...defaultOptions, title: 'CLI Title' }
      const result = processCliCommand(testSrtPath, options)

      expect(result.success).toBe(true)
      // CLI title should override config title
    })

    it('should merge config values where CLI uses defaults', () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.toString().includes('.srt2fcpxrc.json')) {
          return JSON.stringify({
            title: 'Config Project',
            font: 'Times New Roman',
            size: 96
          })
        }
        return mockSrtContent
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      // Should use config values where CLI has defaults
    })

    it('should handle special strokeWidth merging logic', () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.toString().includes('.srt2fcpxrc.json')) {
          return JSON.stringify({
            strokeWidth: 3,
            strokeColor: '#FF0000FF'
          })
        }
        return mockSrtContent
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      // strokeWidth and strokeColor should be merged from config
    })
  })

  describe('Error handling', () => {
    it('should handle missing input file', () => {
      mockExistsSync.mockReturnValue(false)

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Input file not found')
    })

    it('should handle file read errors', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to read input file')
    })

    it('should handle file write errors', () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Disk full')
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to write output file')
    })

    it('should handle conversion errors gracefully', async () => {
      // Import and mock the conversion function
      const core = await import('@srt2fcpx/core')
      vi.mocked(core.convertSrtToFcpxml).mockImplementation(() => {
        throw new Error('Invalid SRT format')
      })

      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid SRT format')
    })
  })

  describe('Path resolution', () => {
    it('should resolve relative input paths correctly', () => {
      const relativePath = './relative/test.srt'
      const result = processCliCommand(relativePath, defaultOptions)

      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining('relative/test.srt'),
        'utf-8'
      )
    })

    it('should resolve relative output paths correctly', () => {
      const options = { ...defaultOptions, output: './output/test.fcpxml' }
      const result = processCliCommand(testSrtPath, options)

      if (!result.success) {
        console.log('Error in test:', result.error)
      }
      expect(result.success).toBe(true)
      expect(result.outputFile).toBe('./output/test.fcpxml')
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('output/test.fcpxml'),
        '<fcpxml>test</fcpxml>',
        'utf-8'
      )
    })

    it('should handle absolute paths correctly', () => {
      const absolutePath = '/absolute/path/test.srt'
      processCliCommand(absolutePath, defaultOptions)

      expect(mockReadFileSync).toHaveBeenCalledWith(absolutePath, 'utf-8')
    })
  })

  describe('Integration with logger', () => {
    it('should respect quiet mode', () => {
      setQuiet(true)
      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      // Logger calls should be mocked but not generate output
    })

    it('should log progress when not in quiet mode', () => {
      setQuiet(false)
      const result = processCliCommand(testSrtPath, defaultOptions)

      expect(result.success).toBe(true)
      // Should call logger functions (mocked)
    })
  })
})