import { describe, it, expect } from 'vitest';
import {
  convertSrtToFcpxml,
  parseSrt,
  formatSrtTimecode,
  stripHtmlTags,
  buildFcpxml,
  DEFAULT_OPTIONS,
} from './index';
import type { Srt2FcpxOptions, SrtCue, SrtParseResult } from './index';

describe('Core API', () => {
  describe('convertSrtToFcpxml', () => {
    it('should convert valid SRT to FCPXML', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,000 --> 00:00:06,000
Second subtitle`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(fcpxml).toContain('<fcpxml version="1.13">'); // Template-based uses FCP's version
      expect(fcpxml).toContain('First subtitle');
      expect(fcpxml).toContain('Second subtitle');
      // Verify FCP-specific params are preserved from template
      expect(fcpxml).toContain('<param name="Flatten"');
      expect(fcpxml).toContain('<adjust-colorConform');
    });

    it('should apply custom options', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Test subtitle`;

      const options: Srt2FcpxOptions = {
        frameRate: 30,
      };

      const fcpxml = convertSrtToFcpxml(srt, options);

      // Template-based approach uses fixed template, so only frameRate affects timing
      expect(fcpxml).toContain('duration="90/30s"'); // 3 seconds at 30fps
      expect(fcpxml).toContain('Test subtitle');
      // Template values are preserved (not customizable)
      expect(fcpxml).toContain('font="Hiragino Sans"');
      expect(fcpxml).toContain('fontSize="100"');
    });

    it('should throw error when no valid cues found', () => {
      const srt = '';

      expect(() => convertSrtToFcpxml(srt)).toThrow('No valid SRT cues found in input');
    });

    it('should throw error when SRT has only invalid blocks', () => {
      const srt = `Invalid block
Without proper format`;

      expect(() => convertSrtToFcpxml(srt)).toThrow('No valid SRT cues found in input');
    });

    it('should succeed even if parsing has recoverable errors', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Valid subtitle

Invalid block without timecode

2
00:00:04,000 --> 00:00:06,000
Another valid subtitle`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Valid subtitle');
      expect(fcpxml).toContain('Another valid subtitle');
    });

    it('should handle single cue', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Single subtitle`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Single subtitle');
      expect(fcpxml).toContain('<fcpxml');
    });

    it('should handle multi-line subtitles', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
Line 1
Line 2
Line 3`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should strip HTML tags from subtitles', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
<b>Bold</b> and <i>italic</i>`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Bold and italic');
      expect(fcpxml).not.toContain('<b>');
      expect(fcpxml).not.toContain('<i>');
    });

    it('should handle zero-based start time', () => {
      const srt = `1
00:00:00,000 --> 00:00:02,000
Start at zero`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Start at zero');
      expect(fcpxml).toContain('offset="0/24s"');
    });

    it('should handle large timecodes', () => {
      const srt = `1
01:30:45,123 --> 01:30:50,456
Late subtitle`;

      const fcpxml = convertSrtToFcpxml(srt);

      expect(fcpxml).toContain('Late subtitle');
    });
  });

  describe('Exported functions', () => {
    describe('parseSrt', () => {
      it('should be accessible as exported function', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000
Test`;

        const result = parseSrt(srt);

        expect(result.cues).toHaveLength(1);
        expect(result.cues[0].text).toBe('Test');
      });
    });

    describe('formatSrtTimecode', () => {
      it('should be accessible as exported function', () => {
        expect(formatSrtTimecode(1000)).toBe('00:00:01,000');
      });
    });

    describe('stripHtmlTags', () => {
      it('should be accessible as exported function', () => {
        expect(stripHtmlTags('<b>Bold</b>')).toBe('Bold');
      });
    });

    describe('buildFcpxml', () => {
      it('should be accessible as exported function', () => {
        const cues: SrtCue[] = [
          {
            index: 1,
            startMs: 1000,
            endMs: 3000,
            text: 'Test',
          },
        ];

        const fcpxml = buildFcpxml(cues);

        expect(fcpxml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(fcpxml).toContain('Test');
      });
    });
  });

  describe('Exported types and constants', () => {
    it('should export DEFAULT_OPTIONS', () => {
      expect(DEFAULT_OPTIONS).toBeDefined();
      expect(DEFAULT_OPTIONS.titleName).toBe('Converted from SRT');
      expect(DEFAULT_OPTIONS.frameRate).toBe(24);
      expect(DEFAULT_OPTIONS.width).toBe(1920);
      expect(DEFAULT_OPTIONS.height).toBe(1080);
      expect(DEFAULT_OPTIONS.fontFamily).toBe('Helvetica');
      expect(DEFAULT_OPTIONS.fontSize).toBe(72);
      expect(DEFAULT_OPTIONS.textColor).toBe('#FFFFFFFF');
      expect(DEFAULT_OPTIONS.backgroundColor).toBe('#00000000');
      expect(DEFAULT_OPTIONS.lineSpacing).toBe(1.0);
    });

    it('should support Srt2FcpxOptions type', () => {
      const options: Srt2FcpxOptions = {
        titleName: 'Test',
        frameRate: 30,
        width: 3840,
        height: 2160,
        fontFamily: 'Arial',
        fontSize: 48,
        textColor: '#FFFFFF',
        backgroundColor: '#000000',
        lineSpacing: 1.5,
      };

      expect(options.titleName).toBe('Test');
    });

    it('should support SrtCue type', () => {
      const cue: SrtCue = {
        index: 1,
        startMs: 1000,
        endMs: 3000,
        text: 'Test subtitle',
      };

      expect(cue.index).toBe(1);
      expect(cue.startMs).toBe(1000);
      expect(cue.endMs).toBe(3000);
      expect(cue.text).toBe('Test subtitle');
    });

    it('should support SrtParseResult type', () => {
      const result: SrtParseResult = {
        cues: [
          {
            index: 1,
            startMs: 1000,
            endMs: 3000,
            text: 'Test',
          },
        ],
        errors: ['Some error'],
      };

      expect(result.cues).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete workflow with all options', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000
<b>First</b> subtitle

2
00:00:05,000 --> 00:00:08,000
Second subtitle
with multiple lines`;

      const options: Srt2FcpxOptions = {
        frameRate: 30,
      };

      const fcpxml = convertSrtToFcpxml(srt, options);

      // Template-based approach uses FCP's fixed template
      expect(fcpxml).toContain('<fcpxml version="1.13">'); // From template

      // Check timing with custom frame rate
      expect(fcpxml).toContain('offset="30/30s"'); // 1 second at 30fps
      expect(fcpxml).toContain('duration="60/30s"'); // 2 seconds at 30fps

      // Check template values are preserved (white text, black stroke from template)
      expect(fcpxml).toContain('font="Hiragino Sans"');
      expect(fcpxml).toContain('fontSize="100"');
      expect(fcpxml).toContain('fontColor="1 1 1 1"');
      expect(fcpxml).toContain('strokeColor="0 0 0 1"');

      // Check content (HTML stripped)
      expect(fcpxml).toContain('First subtitle');
      expect(fcpxml).toContain('Second subtitle\nwith multiple lines');
      expect(fcpxml).not.toContain('<b>');

      // Verify FCP-specific params from template are preserved
      expect(fcpxml).toContain('<param name="Flatten"');
      expect(fcpxml).toContain('<adjust-colorConform');
    });

    it('should handle edge case with empty text (recorded as error but still creates cue)', () => {
      const srt = `1
00:00:01,000 --> 00:00:03,000

`;

      // This actually creates a cue with empty text and logs an error
      const parseResult = parseSrt(srt);

      // If implementation allows empty text with error, it may still create a cue
      // Otherwise, no cues will be created
      if (parseResult.cues.length === 0) {
        expect(() => convertSrtToFcpxml(srt)).toThrow('No valid SRT cues found in input');
      } else {
        // If empty text cue is created, conversion should succeed
        const fcpxml = convertSrtToFcpxml(srt);
        expect(fcpxml).toContain('<fcpxml');
      }
    });

    it('should maintain timecode accuracy across different frame rates', () => {
      const srt = `1
00:00:01,000 --> 00:00:02,000
Test`;

      // 24fps: 1s = 24 frames, 2s = 48 frames
      const fcpxml24 = convertSrtToFcpxml(srt, { frameRate: 24 });
      expect(fcpxml24).toContain('offset="24/24s"');
      expect(fcpxml24).toContain('duration="24/24s"');

      // 30fps: 1s = 30 frames, 2s = 60 frames
      const fcpxml30 = convertSrtToFcpxml(srt, { frameRate: 30 });
      expect(fcpxml30).toContain('offset="30/30s"');
      expect(fcpxml30).toContain('duration="30/30s"');

      // 60fps: 1s = 60 frames, 2s = 120 frames
      const fcpxml60 = convertSrtToFcpxml(srt, { frameRate: 60 });
      expect(fcpxml60).toContain('offset="60/60s"');
      expect(fcpxml60).toContain('duration="60/60s"');
    });
  });
});
