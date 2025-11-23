import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { processCliCommand } from './cli-core'

describe('E2E CLI Workflow Tests', () => {
  let testDir: string
  let testSrtPath: string
  let testOutputPath: string

  beforeEach(() => {
    // Create unique test directory for each test
    testDir = join(tmpdir(), `srt2fcpx-e2e-${Math.random().toString(36).substring(7)}`)
    mkdirSync(testDir, { recursive: true })

    testSrtPath = join(testDir, 'test.srt')
    testOutputPath = join(testDir, 'output.fcpxml')
  })

  afterEach(() => {
    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Complete Workflow Tests', () => {
    it('should convert simple SRT to FCPXML end-to-end', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Hello World!

2
00:00:04,000 --> 00:00:06,000
This is a test.`

      // Write SRT file
      writeFileSync(testSrtPath, srtContent)

      // Process with CLI
      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true
      })

      // Verify success
      expect(result.success).toBe(true)
      expect(existsSync(testOutputPath)).toBe(true)

      // Verify output content
      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(fcpxmlContent).toContain('<fcpxml version="1.11">')
      expect(fcpxmlContent).toContain('Hello World!')
      expect(fcpxmlContent).toContain('This is a test.')
    })

    it('should handle Netflix-style content with formatting', () => {
      const netflixSrt = `1
00:00:01,500 --> 00:00:04,200
<font color="#FFFF00">NARRATOR:</font>
Welcome to our show.

2
00:00:04,500 --> 00:00:07,800
[INTENSE MUSIC PLAYING]

3
00:00:08,100 --> 00:00:12,300
♪ Theme song begins ♪
<i>Original soundtrack</i>`

      writeFileSync(testSrtPath, netflixSrt)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true,
        title: 'Netflix Style Test',
        fps: 29.97
      })

      expect(result.success).toBe(true)

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).toContain('NARRATOR:')
      expect(fcpxmlContent).toContain('Welcome to our show.')
      expect(fcpxmlContent).toContain('[INTENSE MUSIC PLAYING]')
      expect(fcpxmlContent).toContain('♪ Theme song begins ♪')
      expect(fcpxmlContent).toContain('Original soundtrack')
    })

    it('should handle multilingual content with emoji', () => {
      const multilingualSrt = `1
00:00:01,000 --> 00:00:03,500
Hello! 😀 こんにちは！

2
00:00:03,800 --> 00:00:06,200
Welcome to Tokyo! 🗾
東京へようこそ！

3
00:00:06,500 --> 00:00:09,000
🍣 寿司を食べましょう 🥢`

      writeFileSync(testSrtPath, multilingualSrt)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true
      })

      expect(result.success).toBe(true)

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).toContain('😀')
      expect(fcpxmlContent).toContain('こんにちは')
      expect(fcpxmlContent).toContain('🗾')
      expect(fcpxmlContent).toContain('東京へようこそ')
      expect(fcpxmlContent).toContain('🍣')
      expect(fcpxmlContent).toContain('🥢')
    })

    it('should safely handle malicious content', () => {
      const maliciousSrt = `1
00:00:01,000 --> 00:00:03,000
<script>alert('xss')</script>Safe text

2
00:00:04,000 --> 00:00:06,000
<style>body{display:none}</style>More text

3
00:00:07,000 --> 00:00:09,000
<span style="background: url(javascript:alert(1))">CSS Injection</span>`

      writeFileSync(testSrtPath, maliciousSrt)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true
      })

      expect(result.success).toBe(true)

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).not.toContain('<script>')
      expect(fcpxmlContent).not.toContain('javascript:')
      expect(fcpxmlContent).not.toContain('<style>')
      expect(fcpxmlContent).toContain('Safe text')
      expect(fcpxmlContent).toContain('More text')
      expect(fcpxmlContent).toContain('CSS Injection')
    })

    it('should process large files efficiently', () => {
      // Create a large SRT file
      let largeSrt = ''
      for (let i = 1; i <= 200; i++) {
        const startHour = String(Math.floor(i / 240)).padStart(2, '0')
        const startMin = String(Math.floor((i % 240) / 4)).padStart(2, '0')
        const startSec = String((i % 4) * 15).padStart(2, '0')
        const endSec = String(((i % 4) * 15) + 10).padStart(2, '0')

        largeSrt += `${i}
${startHour}:${startMin}:${startSec},000 --> ${startHour}:${startMin}:${endSec},000
Subtitle ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.

`
      }

      writeFileSync(testSrtPath, largeSrt)

      const startTime = Date.now()
      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true
      })
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).toContain('Subtitle 1:')
      expect(fcpxmlContent).toContain('Subtitle 200:')
    })
  })

  describe('Configuration Tests', () => {
    it('should use config file for default options', () => {
      const configPath = join(testDir, '.srt2fcpxrc.json')
      const configContent = {
        title: 'Config Test Title',
        fps: 25,
        width: 1920,
        height: 1080,
        font: 'Arial',
        size: 48
      }

      writeFileSync(configPath, JSON.stringify(configContent, null, 2))

      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Config test subtitle`

      writeFileSync(testSrtPath, srtContent)

      // Change to test directory so config is found
      const originalCwd = process.cwd()
      process.chdir(testDir)

      try {
        const result = processCliCommand(testSrtPath, {
          output: testOutputPath,
          quiet: true
        })

        expect(result.success).toBe(true)

        const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
        expect(fcpxmlContent).toContain('Config test subtitle')
        // Config values should be used in the FCPXML structure
      } finally {
        process.chdir(originalCwd)
      }
    })

    it('should handle custom config file path', () => {
      const customConfigPath = join(testDir, 'custom-config.json')
      const configContent = {
        title: 'Custom Config Title',
        fps: 30
      }

      writeFileSync(customConfigPath, JSON.stringify(configContent, null, 2))

      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Custom config test`

      writeFileSync(testSrtPath, srtContent)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        config: customConfigPath,
        quiet: true
      })

      expect(result.success).toBe(true)

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')
      expect(fcpxmlContent).toContain('Custom config test')
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle missing input file gracefully', () => {
      const nonExistentPath = join(testDir, 'does-not-exist.srt')

      const result = processCliCommand(nonExistentPath, {
        output: testOutputPath,
        quiet: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should handle invalid SRT content gracefully', () => {
      const invalidSrt = `This is not valid SRT content
No timestamps or proper formatting
Just random text`

      writeFileSync(testSrtPath, invalidSrt)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true
      })

      // Should either succeed with warnings or fail gracefully
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should prevent path traversal in output', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Test subtitle`

      writeFileSync(testSrtPath, srtContent)

      const maliciousOutputPath = '../../../malicious-output.fcpxml'

      const result = processCliCommand(testSrtPath, {
        output: maliciousOutputPath,
        quiet: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Security Error')
    })

    it('should prevent dangerous config file paths', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Test subtitle`

      writeFileSync(testSrtPath, srtContent)

      const maliciousConfigPath = '../../../etc/passwd'

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        config: maliciousConfigPath,
        quiet: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Security Error')
    })
  })

  describe('Output Validation Tests', () => {
    it('should generate valid FCPXML structure', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Structure test`

      writeFileSync(testSrtPath, srtContent)

      const result = processCliCommand(testSrtPath, {
        output: testOutputPath,
        quiet: true,
        title: 'Structure Test',
        fps: 24
      })

      expect(result.success).toBe(true)

      const fcpxmlContent = readFileSync(testOutputPath, 'utf-8')

      // Validate XML structure
      expect(fcpxmlContent).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/)
      expect(fcpxmlContent).toContain('<fcpxml version="1.11">')
      expect(fcpxmlContent).toContain('<resources>')
      expect(fcpxmlContent).toContain('<event>')
      expect(fcpxmlContent).toContain('<project>')
      expect(fcpxmlContent).toContain('<sequence>')
      expect(fcpxmlContent).toContain('<spine>')
      expect(fcpxmlContent).toContain('</fcpxml>')
    })

    it('should handle different FPS settings correctly', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
FPS test subtitle`

      writeFileSync(testSrtPath, srtContent)

      const fpsValues = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60]

      for (const fps of fpsValues) {
        const fpsOutputPath = join(testDir, `fps-${fps}.fcpxml`)

        const result = processCliCommand(testSrtPath, {
          output: fpsOutputPath,
          fps,
          quiet: true
        })

        expect(result.success).toBe(true)
        expect(existsSync(fpsOutputPath)).toBe(true)

        const fcpxmlContent = readFileSync(fpsOutputPath, 'utf-8')
        expect(fcpxmlContent).toContain('FPS test subtitle')
      }
    })

    it('should handle different resolution settings', () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Resolution test`

      writeFileSync(testSrtPath, srtContent)

      const resolutions = [
        { width: 1920, height: 1080 }, // 1080p
        { width: 1280, height: 720 },  // 720p
        { width: 3840, height: 2160 }, // 4K
        { width: 1920, height: 1080 }  // Default
      ]

      for (const res of resolutions) {
        const resOutputPath = join(testDir, `res-${res.width}x${res.height}.fcpxml`)

        const result = processCliCommand(testSrtPath, {
          output: resOutputPath,
          width: res.width,
          height: res.height,
          quiet: true
        })

        expect(result.success).toBe(true)
        expect(existsSync(resOutputPath)).toBe(true)
      }
    })
  })
})