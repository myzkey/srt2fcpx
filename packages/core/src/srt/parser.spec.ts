import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities, formatSrtTimecode, parseSrt, stripHtmlTags } from './parser'

describe('SRT Parser', () => {
  describe('parseSrt', () => {
    it('should parse valid SRT content', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,500 --> 00:00:06,000
Second subtitle
with multiple lines`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(2)
      expect(result.cues[0]).toEqual({
        index: 1,
        startMs: 1000,
        endMs: 3000,
        text: 'First subtitle',
      })
      expect(result.cues[1]).toEqual({
        index: 2,
        startMs: 4500,
        endMs: 6000,
        text: 'Second subtitle\nwith multiple lines',
      })
    })

    it('should handle CRLF line endings', () => {
      const srt = '1\r\n00:00:01,000 --> 00:00:03,000\r\nTest'

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].text).toBe('Test')
    })

    it('should handle mixed line endings', () => {
      const srt = '1\r\n00:00:01,000 --> 00:00:03,000\nMixed\r\nline\nendings'

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].text).toBe('Mixed\nline\nendings')
    })

    it('should skip incomplete blocks', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Valid subtitle

2
Invalid block

3
00:00:05,000 --> 00:00:07,000
Another valid subtitle`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(2)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle empty text with error', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000

`

      const result = parseSrt(srt)

      expect(result.errors).toContain('Empty text in cue 1')
    })

    it('should reject invalid index', () => {
      const srt = `abc
00:00:01,000 --> 00:00:03,000
Text`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(0)
      expect(result.errors).toContain('Invalid index: abc')
    })

    it('should reject invalid timecode format', () => {
      const srt = `1
00:00:01 --> 00:00:03
Text`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(0)
      expect(
        result.errors.some((e) => e.includes('Invalid timecode format')),
      ).toBe(true)
    })

    it('should reject end time before or equal to start time', () => {
      const srt = `1
00:00:03,000 --> 00:00:01,000
Text`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(0)
      expect(
        result.errors.some((e) =>
          e.includes('End time must be after start time'),
        ),
      ).toBe(true)
    })

    it('should handle equal start and end times', () => {
      const srt = `1
00:00:01,000 --> 00:00:01,000
Text`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(0)
      expect(
        result.errors.some((e) =>
          e.includes('End time must be after start time'),
        ),
      ).toBe(true)
    })

    it('should parse multiple blocks separated by multiple newlines', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
First



2
00:00:04,000 --> 00:00:05,000
Second`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(2)
    })

    it('should handle blocks with only whitespace lines', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Text


`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].text).toBe('Text')
    })

    it('should parse timecodes with hours correctly', () => {
      const srt = `1
01:30:45,123 --> 02:15:30,456
Long video subtitle`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].startMs).toBe(5445123) // 1h30m45.123s
      expect(result.cues[0].endMs).toBe(8130456) // 2h15m30.456s
    })

    it('should handle empty input', () => {
      const result = parseSrt('')

      expect(result.cues).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle whitespace-only input', () => {
      const result = parseSrt('   \n\n  \n  ')

      expect(result.cues).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should preserve multi-line text with proper formatting', () => {
      const srt = `1
00:00:01,000 --> 00:00:05,000
Line 1
Line 2
Line 3`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].text).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should handle blocks with only one line (incomplete)', () => {
      const srt = `1`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(0)
      expect(
        result.errors.some((e) => e.includes('Skipping incomplete block')),
      ).toBe(true)
    })

    it('should trim whitespace from index and timecode lines', () => {
      const srt = `  1
  00:00:01,000 --> 00:00:03,000
Text`

      const result = parseSrt(srt)

      expect(result.cues).toHaveLength(1)
      expect(result.cues[0].index).toBe(1)
    })
  })

  describe('formatSrtTimecode', () => {
    it('should format zero milliseconds', () => {
      expect(formatSrtTimecode(0)).toBe('00:00:00,000')
    })

    it('should format milliseconds only', () => {
      expect(formatSrtTimecode(500)).toBe('00:00:00,500')
      expect(formatSrtTimecode(999)).toBe('00:00:00,999')
    })

    it('should format seconds', () => {
      expect(formatSrtTimecode(1000)).toBe('00:00:01,000')
      expect(formatSrtTimecode(59999)).toBe('00:00:59,999')
    })

    it('should format minutes', () => {
      expect(formatSrtTimecode(60000)).toBe('00:01:00,000')
      expect(formatSrtTimecode(61500)).toBe('00:01:01,500')
    })

    it('should format hours', () => {
      expect(formatSrtTimecode(3600000)).toBe('01:00:00,000')
      expect(formatSrtTimecode(3661234)).toBe('01:01:01,234')
    })

    it('should format large values', () => {
      expect(formatSrtTimecode(36000000)).toBe('10:00:00,000')
      expect(formatSrtTimecode(359999999)).toBe('99:59:59,999')
    })

    it('should pad single digits correctly', () => {
      expect(formatSrtTimecode(3661001)).toBe('01:01:01,001')
      expect(formatSrtTimecode(3661010)).toBe('01:01:01,010')
      expect(formatSrtTimecode(3661100)).toBe('01:01:01,100')
    })
  })

  describe('stripHtmlTags', () => {
    it('should remove simple HTML tags', () => {
      expect(stripHtmlTags('<b>Bold</b>')).toBe('Bold')
      expect(stripHtmlTags('<i>Italic</i>')).toBe('Italic')
      expect(stripHtmlTags('<u>Underline</u>')).toBe('Underline')
    })

    it('should remove tags with attributes', () => {
      expect(stripHtmlTags('<font color="red">Red text</font>')).toBe(
        'Red text',
      )
      expect(stripHtmlTags('<span class="subtitle">Text</span>')).toBe('Text')
    })

    it('should remove multiple tags', () => {
      expect(stripHtmlTags('<b>Bold</b> and <i>Italic</i>')).toBe(
        'Bold and Italic',
      )
    })

    it('should remove nested tags', () => {
      expect(stripHtmlTags('<b><i>Bold Italic</i></b>')).toBe('Bold Italic')
    })

    it('should handle self-closing tags', () => {
      expect(stripHtmlTags('Line 1<br/>Line 2')).toBe('Line 1Line 2')
      expect(stripHtmlTags('Text<hr/>')).toBe('Text')
    })

    it('should handle text without tags', () => {
      expect(stripHtmlTags('Plain text')).toBe('Plain text')
    })

    it('should handle empty string', () => {
      expect(stripHtmlTags('')).toBe('')
    })

    it('should handle multiple consecutive tags', () => {
      expect(stripHtmlTags('<b></b><i></i>Text')).toBe('Text')
    })

    it('should remove tags with special characters in attributes', () => {
      expect(
        stripHtmlTags('<a href="http://example.com?foo=bar&baz=qux">Link</a>'),
      ).toBe('Link')
    })

    it('should remove content between < and > even if not valid tags', () => {
      expect(stripHtmlTags('Text with < and > characters')).toBe(
        'Text with  characters',
      )
    })

    it('should remove tags but preserve line breaks in content', () => {
      expect(stripHtmlTags('<b>Line 1\nLine 2</b>')).toBe('Line 1\nLine 2')
    })

    it('should handle mixed content', () => {
      const input =
        'Normal <b>bold</b> text with <i>italic</i> and <u>underline</u>'
      const expected = 'Normal bold text with italic and underline'
      expect(stripHtmlTags(input)).toBe(expected)
    })

    // Enhanced tests for improved functionality
    it('should remove HTML comments', () => {
      expect(stripHtmlTags('Text <!-- comment --> more text')).toBe('Text more text')
      expect(stripHtmlTags('<!-- Start comment -->Text<!-- End comment -->')).toBe('Text')
    })

    it('should remove script tags (security)', () => {
      expect(stripHtmlTags('Text<script>alert("XSS")</script>more')).toBe('Textmore')
      expect(stripHtmlTags('<script src="malicious.js"></script>Clean text')).toBe('Clean text')
    })

    it('should remove style tags', () => {
      expect(stripHtmlTags('Text<style>body{color:red}</style>more')).toBe('Textmore')
      expect(stripHtmlTags('<style type="text/css">.class{}</style>Clean')).toBe('Clean')
    })

    it('should handle malformed tags', () => {
      expect(stripHtmlTags('Text<tag without closing')).toBe('Text')
      expect(stripHtmlTags('Text<')).toBe('Text')
      expect(stripHtmlTags('Text< incomplete tag')).toBe('Text')
    })

    it('should decode HTML entities', () => {
      expect(stripHtmlTags('&amp; &lt; &gt; &quot;')).toBe('& < > "')
      expect(stripHtmlTags('&copy; &reg; &trade;')).toBe('© ® ™')
      expect(stripHtmlTags('&nbsp;Text&nbsp;')).toBe(' Text ')
    })

    it('should decode numeric entities', () => {
      expect(stripHtmlTags('&#65;&#66;&#67;')).toBe('ABC')
      expect(stripHtmlTags('&#x41;&#x42;&#x43;')).toBe('ABC')
      expect(stripHtmlTags('Letter: &#65;')).toBe('Letter: A')
    })

    it('should handle complex nested HTML', () => {
      const input = '<div class="subtitle"><b>Bold <i>and italic</i></b> &amp; <u>underline</u></div>'
      const expected = 'Bold and italic & underline'
      expect(stripHtmlTags(input)).toBe(expected)
    })

    it('should clean up excessive whitespace', () => {
      expect(stripHtmlTags('  Multiple   \n  \t  spaces  ')).toBe('Multiple\nspaces')
      expect(stripHtmlTags('<br>Line1<br/><br>Line2<br>')).toBe('Line1Line2')
    })

    it('should handle edge cases safely', () => {
      expect(stripHtmlTags('<>&<>')).toBe('&')
      expect(stripHtmlTags('<<>>')).toBe('>')
      expect(stripHtmlTags('Text<<<>>>')).toBe('Text >>')
    })

    it('should handle real-world SRT content', () => {
      const input = '<font color="yellow">Warning:</font> <b>Danger ahead!</b><br>Please be careful.'
      const expected = 'Warning: Danger ahead! Please be careful.'
      expect(stripHtmlTags(input)).toBe(expected)
    })
  })

  describe('decodeHtmlEntities', () => {
    it('should decode basic HTML entities', () => {
      expect(decodeHtmlEntities('&amp;')).toBe('&')
      expect(decodeHtmlEntities('&lt;')).toBe('<')
      expect(decodeHtmlEntities('&gt;')).toBe('>')
      expect(decodeHtmlEntities('&quot;')).toBe('"')
      expect(decodeHtmlEntities('&#39;')).toBe("'")
    })

    it('should decode special character entities', () => {
      expect(decodeHtmlEntities('&copy;')).toBe('©')
      expect(decodeHtmlEntities('&reg;')).toBe('®')
      expect(decodeHtmlEntities('&trade;')).toBe('™')
      expect(decodeHtmlEntities('&euro;')).toBe('€')
      expect(decodeHtmlEntities('&pound;')).toBe('£')
      expect(decodeHtmlEntities('&yen;')).toBe('¥')
      expect(decodeHtmlEntities('&nbsp;')).toBe(' ')
    })

    it('should decode numeric entities (decimal)', () => {
      expect(decodeHtmlEntities('&#65;')).toBe('A')
      expect(decodeHtmlEntities('&#97;')).toBe('a')
      expect(decodeHtmlEntities('&#48;')).toBe('0')
      expect(decodeHtmlEntities('&#8364;')).toBe('€')
    })

    it('should decode numeric entities (hexadecimal)', () => {
      expect(decodeHtmlEntities('&#x41;')).toBe('A')
      expect(decodeHtmlEntities('&#x61;')).toBe('a')
      expect(decodeHtmlEntities('&#x30;')).toBe('0')
      expect(decodeHtmlEntities('&#x20AC;')).toBe('€')
      expect(decodeHtmlEntities('&#X20AC;')).toBe('€') // Case insensitive
    })

    it('should handle multiple entities in text', () => {
      expect(decodeHtmlEntities('AT&amp;T &lt;company&gt; &quot;quotes&quot;')).toBe('AT&T <company> "quotes"')
    })

    it('should handle invalid entities gracefully', () => {
      expect(decodeHtmlEntities('&#2000000;')).toBe('') // Out of range (beyond 0x10FFFF)
      expect(decodeHtmlEntities('&#-1;')).toBe('') // Negative
      expect(decodeHtmlEntities('&#x200000;')).toBe('') // Out of range hex (beyond 0x10FFFF)
      expect(decodeHtmlEntities('&invalid;')).toBe('&invalid;') // Unknown entity
    })

    it('should be case insensitive for named entities', () => {
      expect(decodeHtmlEntities('&AMP;')).toBe('&')
      expect(decodeHtmlEntities('&Lt;')).toBe('<')
      expect(decodeHtmlEntities('&GT;')).toBe('>')
    })

    it('should handle empty and edge cases', () => {
      expect(decodeHtmlEntities('')).toBe('')
      expect(decodeHtmlEntities('No entities here')).toBe('No entities here')
      expect(decodeHtmlEntities('&;')).toBe('&;') // Incomplete entity
      expect(decodeHtmlEntities('&#;')).toBe('&#;') // Incomplete numeric entity
    })

    it('should decode Unicode supplementary characters (emoji and symbols)', () => {
      // Test emoji in Unicode supplementary planes (U+10000 and above)
      expect(decodeHtmlEntities('&#128512;')).toBe('😀') // U+1F600 (grinning face)
      expect(decodeHtmlEntities('&#128513;')).toBe('😁') // U+1F601 (grinning face with smiling eyes)
      expect(decodeHtmlEntities('&#128514;')).toBe('😂') // U+1F602 (face with tears of joy)
      expect(decodeHtmlEntities('&#129315;')).toBe('🤣') // U+1F923 (rolling on floor laughing)

      // Test heart emoji
      expect(decodeHtmlEntities('&#10084;')).toBe('❤') // U+2764 (red heart)
      expect(decodeHtmlEntities('&#128153;')).toBe('💙') // U+1F499 (blue heart)

      // Test additional Unicode symbols
      expect(decodeHtmlEntities('&#8364;')).toBe('€') // U+20AC (Euro sign)
      expect(decodeHtmlEntities('&#9733;')).toBe('★') // U+2605 (Black star)

      // Test in hexadecimal format
      expect(decodeHtmlEntities('&#x1F600;')).toBe('😀') // U+1F600 (grinning face)
      expect(decodeHtmlEntities('&#x1F601;')).toBe('😁') // U+1F601 (grinning face with smiling eyes)
      expect(decodeHtmlEntities('&#x1F602;')).toBe('😂') // U+1F602 (face with tears of joy)
      expect(decodeHtmlEntities('&#x1F923;')).toBe('🤣') // U+1F923 (rolling on floor laughing)

      // Test case insensitive hex
      expect(decodeHtmlEntities('&#X1F600;')).toBe('😀') // U+1F600 uppercase X
      expect(decodeHtmlEntities('&#x1f600;')).toBe('😀') // U+1F600 lowercase hex
    })

    it('should handle Unicode edge cases and invalid ranges', () => {
      // Test maximum valid Unicode code point
      expect(decodeHtmlEntities('&#1114111;')).toBe('\u{10FFFF}') // U+10FFFF (max valid Unicode)
      expect(decodeHtmlEntities('&#x10FFFF;')).toBe('\u{10FFFF}') // U+10FFFF in hex

      // Test surrogate pair range (should be rejected)
      expect(decodeHtmlEntities('&#55296;')).toBe('') // U+D800 (high surrogate start)
      expect(decodeHtmlEntities('&#57343;')).toBe('') // U+DFFF (low surrogate end)
      expect(decodeHtmlEntities('&#xD800;')).toBe('') // U+D800 in hex
      expect(decodeHtmlEntities('&#xDFFF;')).toBe('') // U+DFFF in hex

      // Test beyond valid Unicode range
      expect(decodeHtmlEntities('&#1114112;')).toBe('') // U+110000 (beyond max)
      expect(decodeHtmlEntities('&#2000000;')).toBe('') // Way beyond max
      expect(decodeHtmlEntities('&#x110000;')).toBe('') // U+110000 in hex

      // Test zero and negative numbers
      expect(decodeHtmlEntities('&#0;')).toBe('') // NULL character (invalid)
      expect(decodeHtmlEntities('&#-1;')).toBe('') // Negative (invalid)
    })

    it('should handle mixed Unicode content with traditional entities', () => {
      // Mix of emoji, traditional entities, and plain text
      const input = 'Hello &#128512; &amp; welcome &#x1F602; to our &lt;amazing&gt; world! &#129315;'
      const expected = 'Hello 😀 & welcome 😂 to our <amazing> world! 🤣'
      expect(decodeHtmlEntities(input)).toBe(expected)

      // Test with Japanese characters and emoji
      const japaneseInput = 'こんにちは &#128512; &amp; &#x1F44B; 世界！'
      const japaneseExpected = 'こんにちは 😀 & 👋 世界！'
      expect(decodeHtmlEntities(japaneseInput)).toBe(japaneseExpected)
    })

    it('should handle complex Unicode sequences', () => {
      // Test with skin tone modifiers (though they may not be in SRT files typically)
      expect(decodeHtmlEntities('&#128075;')).toBe('👋') // U+1F44B (waving hand)

      // Test various symbols in supplementary planes
      expect(decodeHtmlEntities('&#127881;')).toBe('🎉') // U+1F389 (party popper)
      expect(decodeHtmlEntities('&#128640;')).toBe('🚀') // U+1F680 (rocket)
      expect(decodeHtmlEntities('&#127775;')).toBe('🌟') // U+1F31F (glowing star)

      // Test musical symbols
      expect(decodeHtmlEntities('&#127925;')).toBe('🎵') // U+1F3B5 (musical note)
      expect(decodeHtmlEntities('&#127926;')).toBe('🎶') // U+1F3B6 (multiple musical notes)
    })
  })
})
