import { describe, it, expect } from 'vitest';
import { parseSrt, formatSrtTimecode } from '../src/srt/parser';

describe('SRT Parser', () => {
  describe('parseSrt', () => {
    it('should parse valid SRT content', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,500 --> 00:00:06,000
Second subtitle
with multiple lines`;

      const result = parseSrt(srt);

      expect(result.cues).toHaveLength(2);
      expect(result.cues[0]).toEqual({
        index: 1,
        startMs: 1000,
        endMs: 3000,
        text: 'First subtitle',
      });
      expect(result.cues[1]).toEqual({
        index: 2,
        startMs: 4500,
        endMs: 6000,
        text: 'Second subtitle\nwith multiple lines',
      });
    });

    it('should handle CRLF line endings', () => {
      const srt = '1\r\n00:00:01,000 --> 00:00:03,000\r\nTest';

      const result = parseSrt(srt);

      expect(result.cues).toHaveLength(1);
      expect(result.cues[0].text).toBe('Test');
    });

    it('should skip incomplete blocks', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Valid subtitle

2
Invalid block

3
00:00:05,000 --> 00:00:07,000
Another valid subtitle`;

      const result = parseSrt(srt);

      expect(result.cues).toHaveLength(2);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatSrtTimecode', () => {
    it('should format milliseconds to SRT timecode', () => {
      expect(formatSrtTimecode(0)).toBe('00:00:00,000');
      expect(formatSrtTimecode(1000)).toBe('00:00:01,000');
      expect(formatSrtTimecode(61500)).toBe('00:01:01,500');
      expect(formatSrtTimecode(3661234)).toBe('01:01:01,234');
    });
  });
});
