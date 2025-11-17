import { describe, it, expect } from 'vitest';
import { buildFcpxml } from './builder';
import { SrtCue, DEFAULT_OPTIONS } from '~/types';

describe('FCPXML Builder', () => {
  describe('buildFcpxml', () => {
    const basicCues: SrtCue[] = [
      {
        index: 1,
        startMs: 1000,
        endMs: 3000,
        text: 'First subtitle',
      },
      {
        index: 2,
        startMs: 4000,
        endMs: 6000,
        text: 'Second subtitle',
      },
    ];

    it('should generate valid FCPXML with default options', () => {
      const xml = buildFcpxml(basicCues);

      // Check XML declaration
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<!DOCTYPE fcpxml>');

      // Check format version
      expect(xml).toContain(`<fcpxml version="${DEFAULT_OPTIONS.formatVersion}">`);

      // Check resource definitions
      expect(xml).toContain('<resources>');
      expect(xml).toContain('id="r1"');
      expect(xml).toContain('id="r2"');
      expect(xml).toContain('name="Basic Title"');

      // Check title elements
      expect(xml).toContain('First subtitle');
      expect(xml).toContain('Second subtitle');
    });

    it('should handle empty cues array', () => {
      const xml = buildFcpxml([]);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<spine>');
      expect(xml).toContain('</spine>');
      expect(xml).toContain('duration="0/24s"');
    });

    it('should apply custom title name', () => {
      const xml = buildFcpxml(basicCues, { titleName: 'Custom Project' });

      expect(xml).toContain('<event name="Custom Project">');
      expect(xml).toContain('<project name="Custom Project">');
    });

    it('should apply custom frame rate', () => {
      const xml = buildFcpxml(basicCues, { frameRate: 30 });

      expect(xml).toContain('frameDuration="1/30s"');
      expect(xml).toContain('FFVideoFormat1080p30');
    });

    it('should apply custom resolution', () => {
      const xml = buildFcpxml(basicCues, { width: 3840, height: 2160 });

      expect(xml).toContain('width="3840"');
      expect(xml).toContain('height="2160"');
      expect(xml).toContain('FFVideoFormat2160p24');
    });

    it('should apply custom font family', () => {
      const xml = buildFcpxml(basicCues, { fontFamily: 'Arial' });

      expect(xml).toContain('font="Arial"');
    });

    it('should apply custom font size', () => {
      const xml = buildFcpxml(basicCues, { fontSize: 48 });

      expect(xml).toContain('fontSize="48"');
    });

    it('should convert text color to FCPXML format', () => {
      const xml = buildFcpxml(basicCues, { textColor: '#FF0000FF' });

      // Red color: #FF0000FF -> 1 0 0 1 (integers for 0 and 1, decimals for fractions)
      expect(xml).toContain('fontColor="1 0 0 1"');
    });

    it('should convert background color to FCPXML format', () => {
      const xml = buildFcpxml(basicCues, { backgroundColor: '#00FF00FF' });

      // Green color: #00FF00FF -> 0 1 0 1 (integers for 0 and 1)
      expect(xml).toContain('backgroundColor="0 1 0 1"');
    });

    it('should handle hex colors without alpha channel', () => {
      const xml = buildFcpxml(basicCues, { textColor: '#0000FF' });

      // Blue color without alpha: #0000FF -> 0 0 1 1
      expect(xml).toContain('fontColor="0 0 1 1"');
    });

    it('should escape XML special characters in text', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'Text with & "quotes" and \'apostrophes\'',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;quotes&quot;');
      expect(xml).toContain('&apos;apostrophes&apos;');
    });

    it('should escape XML special characters in title name', () => {
      const xml = buildFcpxml(basicCues, { titleName: 'Project <Test> & "Name"' });

      expect(xml).toContain('<event name="Project &lt;Test&gt; &amp; &quot;Name&quot;">');
      expect(xml).toContain('<project name="Project &lt;Test&gt; &amp; &quot;Name&quot;">');
    });

    it('should strip HTML tags from subtitle text', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: '<b>Bold</b> and <i>italic</i> text',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('Bold and italic text');
      expect(xml).not.toContain('<b>');
      expect(xml).not.toContain('<i>');
    });

    it('should handle multi-line text', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'Line 1\nLine 2\nLine 3',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('Line 1\nLine 2\nLine 3');
    });

    it('should create abbreviated title names for long text', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'This is a very long subtitle text that should be abbreviated',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('Basic Title: This is a very long ...');
    });

    it('should not abbreviate short title names', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'Short text',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('Basic Title: Short text"');
      expect(xml).not.toContain('Short text...');
    });

    it('should replace newlines in title preview with spaces', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'Line 1\nLine 2',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('Basic Title: Line 1 Line 2');
    });

    it('should calculate correct duration from cues', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000,
          endMs: 3000,
          text: 'First',
        },
        {
          index: 2,
          startMs: 4000,
          endMs: 10000, // Latest end time
          text: 'Second',
        },
        {
          index: 3,
          startMs: 5000,
          endMs: 8000,
          text: 'Third',
        },
      ];

      const xml = buildFcpxml(cues);

      // 10000ms / 1000 * 24fps = 240 frames
      expect(xml).toContain('duration="240/24s"');
    });

    it('should set correct offset and duration for each title', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 2000, // 2s * 24fps = 48 frames
          endMs: 5000,   // 3s duration * 24fps = 72 frames
          text: 'Test',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('offset="48/24s"');
      expect(xml).toContain('duration="72/24s"');
      expect(xml).toContain('start="48/24s"');
    });

    it('should round to frame boundaries', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1001, // 1.001s * 24fps = 24.024 -> 24 frames
          endMs: 2999,   // 2.999s * 24fps = 71.976 -> 71 frames, duration = 47 frames
          text: 'Test',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('offset="24/24s"');
      expect(xml).toContain('duration="47/24s"');
    });

    it('should create unique text-style IDs for each cue', () => {
      const xml = buildFcpxml(basicCues);

      expect(xml).toContain('ref="ts1"');
      expect(xml).toContain('id="ts1"');
      expect(xml).toContain('ref="ts2"');
      expect(xml).toContain('id="ts2"');
    });

    it('should include all required text-style attributes', () => {
      const xml = buildFcpxml(basicCues);

      expect(xml).toContain('font=');
      expect(xml).toContain('fontSize=');
      expect(xml).toContain('fontFace="Regular"');
      expect(xml).toContain('fontColor=');
      expect(xml).toContain('backgroundColor=');
      expect(xml).toContain('alignment="center"');
    });

    it('should generate well-formed XML structure', () => {
      const xml = buildFcpxml(basicCues);

      // Check proper nesting
      expect(xml).toContain('<fcpxml');
      expect(xml).toContain('</fcpxml>');
      expect(xml).toContain('<library>');
      expect(xml).toContain('</library>');
      expect(xml).toContain('<event');
      expect(xml).toContain('</event>');
      expect(xml).toContain('<project');
      expect(xml).toContain('</project>');
      expect(xml).toContain('<sequence');
      expect(xml).toContain('</sequence>');
      expect(xml).toContain('<spine>');
      expect(xml).toContain('</spine>');
    });

    it('should handle zero start time', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 0,
          endMs: 2000,
          text: 'First subtitle at start',
        },
      ];

      const xml = buildFcpxml(cues);

      expect(xml).toContain('offset="0/24s"');
      expect(xml).toContain('start="0/24s"');
    });

    it('should set tcStart to 0s', () => {
      const xml = buildFcpxml(basicCues);

      expect(xml).toContain('tcStart="0s"');
    });

    it('should set tcFormat to NDF', () => {
      const xml = buildFcpxml(basicCues);

      expect(xml).toContain('tcFormat="NDF"');
    });

    it('should apply custom format version', () => {
      const xml = buildFcpxml(basicCues, { formatVersion: '1.9' });

      expect(xml).toContain('<fcpxml version="1.9">');
    });

    it('should handle very large millisecond values', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 3600000, // 1 hour
          endMs: 3660000,   // 1 hour 1 minute
          text: 'Late subtitle',
        },
      ];

      const xml = buildFcpxml(cues, { frameRate: 24 });

      // 3600000ms = 3600s * 24fps = 86400 frames
      expect(xml).toContain('offset="86400/24s"');
      // Duration: 60000ms = 60s * 24fps = 1440 frames
      expect(xml).toContain('duration="1440/24s"');
    });

    it('should handle different frame rates correctly', () => {
      const cues: SrtCue[] = [
        {
          index: 1,
          startMs: 1000, // 1s
          endMs: 2000,   // 2s
          text: 'Test',
        },
      ];

      // 30 fps
      const xml30 = buildFcpxml(cues, { frameRate: 30 });
      expect(xml30).toContain('offset="30/30s"');
      expect(xml30).toContain('duration="30/30s"');

      // 60 fps
      const xml60 = buildFcpxml(cues, { frameRate: 60 });
      expect(xml60).toContain('offset="60/60s"');
      expect(xml60).toContain('duration="60/60s"');
    });

    it('should merge custom options with defaults', () => {
      const xml = buildFcpxml(basicCues, {
        titleName: 'Custom',
        frameRate: 30,
        // Other options should use defaults
      });

      expect(xml).toContain('<event name="Custom">');
      expect(xml).toContain('frameDuration="1/30s"');
      expect(xml).toContain('width="1920"'); // Default
      expect(xml).toContain('height="1080"'); // Default
      expect(xml).toContain('font="Helvetica"'); // Default
    });

    it('should handle semitransparent colors', () => {
      const xml = buildFcpxml(basicCues, {
        textColor: '#FFFFFF80', // 50% opacity
        backgroundColor: '#00000040', // 25% opacity
      });

      // Alpha channel: 0x80 = 128/255 ≈ 0.502 (integers for 0/1, decimals for fractions)
      expect(xml).toContain('fontColor="1 1 1 0.5');
      // Alpha channel: 0x40 = 64/255 ≈ 0.251
      expect(xml).toContain('backgroundColor="0 0 0 0.2');
    });
  });
});
