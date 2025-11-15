import { describe, it, expect } from 'vitest';
import { convertSrtToFcpxml } from '../src/index';

describe('SRT to FCPXML Conversion', () => {
  it('should convert basic SRT to FCPXML', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,500 --> 00:00:06,000
Second subtitle`;

    const fcpxml = convertSrtToFcpxml(srt);

    expect(fcpxml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(fcpxml).toContain('<fcpxml version="1.8">');
    expect(fcpxml).toContain('First subtitle');
    expect(fcpxml).toContain('Second subtitle');
  });

  it('should apply custom options', () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Test subtitle`;

    const fcpxml = convertSrtToFcpxml(srt, {
      titleName: 'My Project',
      frameRate: 30,
      fontFamily: 'Arial',
      fontSize: 100,
    });

    expect(fcpxml).toContain('My Project');
    expect(fcpxml).toContain('frameDuration="1/30s"');
    expect(fcpxml).toContain('font="Arial"');
    expect(fcpxml).toContain('fontSize="100"');
  });

  it('should throw error for empty input', () => {
    const srt = '';

    expect(() => convertSrtToFcpxml(srt)).toThrow('No valid SRT cues found');
  });
});
