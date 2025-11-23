import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { logger, setQuiet, isQuiet } from './logger'

// Mock chalk to ensure consistent color output in tests
vi.mock('chalk', () => ({
  default: {
    blue: (str: string) => `\u001b[34m${str}\u001b[39m`,
    green: (str: string) => `\u001b[32m${str}\u001b[39m`,
    yellow: (str: string) => `\u001b[33m${str}\u001b[39m`,
    red: (str: string) => `\u001b[31m${str}\u001b[39m`,
    gray: (str: string) => `\u001b[90m${str}\u001b[39m`,
  }
}))

describe('Logger', () => {
  // Mock console methods
  const consoleMocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    // Reset quiet mode before each test
    setQuiet(false)

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(consoleMocks.log)
    vi.spyOn(console, 'warn').mockImplementation(consoleMocks.warn)
    vi.spyOn(console, 'error').mockImplementation(consoleMocks.error)
  })

  afterEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Quiet mode management', () => {
    it('should default to not quiet', () => {
      expect(isQuiet()).toBe(false)
    })

    it('should set quiet mode to true', () => {
      setQuiet(true)
      expect(isQuiet()).toBe(true)
    })

    it('should set quiet mode to false', () => {
      setQuiet(true)
      setQuiet(false)
      expect(isQuiet()).toBe(false)
    })
  })

  describe('Info logging', () => {
    it('should log info messages when not in quiet mode', () => {
      setQuiet(false)
      logger.info('Test info message')

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      )
    })

    it('should not log info messages when in quiet mode', () => {
      setQuiet(true)
      logger.info('Test info message')

      expect(consoleMocks.log).not.toHaveBeenCalled()
    })

    it('should log info messages with additional arguments', () => {
      setQuiet(false)
      logger.info('Test message', 'arg1', 42)

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
        'arg1',
        42
      )
    })
  })

  describe('Success logging', () => {
    it('should log success messages when not in quiet mode', () => {
      setQuiet(false)
      logger.success('Test success message')

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Test success message')
      )
    })

    it('should not log success messages when in quiet mode', () => {
      setQuiet(true)
      logger.success('Test success message')

      expect(consoleMocks.log).not.toHaveBeenCalled()
    })

    it('should log success messages with additional arguments', () => {
      setQuiet(false)
      logger.success('Success!', { data: 'test' })

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Success!'),
        { data: 'test' }
      )
    })
  })

  describe('Warning logging', () => {
    it('should log warning messages when not in quiet mode', () => {
      setQuiet(false)
      logger.warn('Test warning message')

      expect(consoleMocks.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      )
    })

    it('should not log warning messages when in quiet mode', () => {
      setQuiet(true)
      logger.warn('Test warning message')

      expect(consoleMocks.warn).not.toHaveBeenCalled()
    })

    it('should log warning messages with additional arguments', () => {
      setQuiet(false)
      logger.warn('Warning!', new Error('test error'))

      expect(consoleMocks.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning!'),
        expect.any(Error)
      )
    })
  })

  describe('Error logging', () => {
    it('should always log error messages regardless of quiet mode', () => {
      setQuiet(false)
      logger.error('Test error message')

      expect(consoleMocks.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      )
    })

    it('should log error messages even when in quiet mode', () => {
      setQuiet(true)
      logger.error('Test error message')

      expect(consoleMocks.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      )
    })

    it('should log error messages with additional arguments', () => {
      setQuiet(true)
      const error = new Error('Test error')
      logger.error('Error occurred:', error.message, { code: 500 })

      expect(consoleMocks.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred:'),
        'Test error',
        { code: 500 }
      )
    })
  })

  describe('Debug logging', () => {
    it('should log debug messages when not in quiet mode', () => {
      setQuiet(false)
      logger.debug('Test debug message')

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      )
    })

    it('should not log debug messages when in quiet mode', () => {
      setQuiet(true)
      logger.debug('Test debug message')

      expect(consoleMocks.log).not.toHaveBeenCalled()
    })

    it('should log debug messages with additional arguments', () => {
      setQuiet(false)
      logger.debug('Debug info:', { timestamp: Date.now() })

      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringContaining('Debug info:'),
        expect.objectContaining({ timestamp: expect.any(Number) })
      )
    })
  })

  describe('Color formatting', () => {
    it('should apply blue color to info messages', () => {
      setQuiet(false)
      logger.info('Test message')

      // Check that the message includes ANSI color codes for blue
      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m.*Test message.*\u001b\[\d+m/)
      )
    })

    it('should apply green color to success messages', () => {
      setQuiet(false)
      logger.success('Success!')

      // Check that the message includes ANSI color codes for green
      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m.*Success!.*\u001b\[\d+m/)
      )
    })

    it('should apply yellow color to warning messages', () => {
      setQuiet(false)
      logger.warn('Warning!')

      // Check that the message includes ANSI color codes for yellow
      expect(consoleMocks.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m.*Warning!.*\u001b\[\d+m/)
      )
    })

    it('should apply red color to error messages', () => {
      setQuiet(true)
      logger.error('Error!')

      // Check that the message includes ANSI color codes for red
      expect(consoleMocks.error).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m.*Error!.*\u001b\[\d+m/)
      )
    })

    it('should apply gray color to debug messages', () => {
      setQuiet(false)
      logger.debug('Debug!')

      // Check that the message includes ANSI color codes for gray
      expect(consoleMocks.log).toHaveBeenCalledWith(
        expect.stringMatching(/\u001b\[\d+m.*Debug!.*\u001b\[\d+m/)
      )
    })
  })

  describe('Integration scenarios', () => {
    it('should handle rapid toggling of quiet mode', () => {
      setQuiet(false)
      logger.info('Message 1')

      setQuiet(true)
      logger.info('Message 2')

      setQuiet(false)
      logger.info('Message 3')

      expect(consoleMocks.log).toHaveBeenCalledTimes(2)
      expect(consoleMocks.log).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Message 1')
      )
      expect(consoleMocks.log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Message 3')
      )
    })

    it('should handle mixed log levels correctly', () => {
      setQuiet(false)
      logger.info('Info')
      logger.warn('Warning')
      logger.error('Error')
      logger.debug('Debug')

      expect(consoleMocks.log).toHaveBeenCalledTimes(2) // info + debug
      expect(consoleMocks.warn).toHaveBeenCalledTimes(1)
      expect(consoleMocks.error).toHaveBeenCalledTimes(1)
    })

    it('should maintain error visibility in mixed quiet scenarios', () => {
      // Start not quiet
      setQuiet(false)
      logger.info('Info 1')
      logger.error('Error 1')

      // Switch to quiet
      setQuiet(true)
      logger.info('Info 2') // Should not log
      logger.error('Error 2') // Should still log

      expect(consoleMocks.log).toHaveBeenCalledTimes(1) // Only "Info 1"
      expect(consoleMocks.error).toHaveBeenCalledTimes(2) // Both errors
    })
  })
})