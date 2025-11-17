# srt2fcpx

[![CI](https://github.com/myzkey/srt2fcpx/actions/workflows/ci.yml/badge.svg)](https://github.com/myzkey/srt2fcpx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

Convert SRT subtitle files to Final Cut Pro FCPXML format.

## Why?

- You already have SRT subtitles (e.g., from Whisper, YouTube, or manual transcription)
- Final Cut Pro cannot directly import SRT as title clips
- Manually copy-pasting subtitles is painful and time-consuming

`srt2fcpx` converts SRT files into FCPXML so that you can import them as title clips on the timeline in seconds.

## Features

- ✅ **SRT to FCPXML conversion** - Instant conversion from SRT to Final Cut Pro XML format
- ✅ **Multi-line subtitles** - Preserves line breaks in subtitle text
- ✅ **Unicode support** - Full support for Japanese, Chinese, emoji, and other Unicode characters
- ✅ **Customizable styling** - Font family, size, color, stroke, and more
- ✅ **Frame rate support** - Works with 24, 30, 60fps and any custom frame rate
- ✅ **Template-based output** - Uses FCP-exported XML as template to preserve all parameters
- ✅ **Config file support** - Set default options via `.srt2fcpxrc.json` or `srt2fcpx.config.json`
- ✅ **CLI + Library** - Use as command-line tool or integrate into your Node.js project
- ✅ **FCPXML 1.8+ compatible** - Works with modern Final Cut Pro versions

**Tested with:** Final Cut Pro 11.2

## Installation

```bash
npm install srt2fcpx
# or
pnpm add srt2fcpx
```

## Usage

### CLI

```bash
# Basic conversion
npx srt2fcpx input.srt -o output.fcpxml

# With custom settings
npx srt2fcpx input.srt -o output.fcpxml \
  --frame-rate 24 \
  --font-family "Hiragino Sans W8" \
  --font-size 100 \
  --text-color "#FFFFFF"

# Pipe to stdout
npx srt2fcpx input.srt > output.fcpxml

# Dry run (parse only)
npx srt2fcpx input.srt --dry-run --verbose
```

### Configuration File

You can create a configuration file to set default options:

**`.srt2fcpxrc.json`** or **`srt2fcpx.config.json`** in your project directory:

```json
{
  "title": "My Video Project",
  "fps": 30,
  "font": "Hiragino Sans",
  "size": 100,
  "face": "W8",
  "color": "#FFFFFFFF",
  "strokeColor": "#000000FF",
  "strokeWidth": -8
}
```

The CLI will automatically discover and use config files in this order:
1. `.srt2fcpxrc.json` in current directory
2. `srt2fcpx.config.json` in current directory
3. `.srt2fcpxrc.json` in home directory

You can also specify a custom config file:

```bash
npx srt2fcpx input.srt --config custom-config.json
```

**Priority:** CLI options > Config file > Default values

### Library

```typescript
import { convertSrtToFcpxml } from 'srt2fcpx';

const srtContent = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,500 --> 00:00:06,000
Second subtitle`;

const fcpxml = convertSrtToFcpxml(srtContent, {
  frameRate: 24,
  fontFamily: 'Hiragino Sans W8',
  fontSize: 100,
  textColor: '#FFFFFF',
});

console.log(fcpxml);
```

## API

### `convertSrtToFcpxml(srtSource: string, options?: Srt2FcpxOptions): string`

Convert SRT content to FCPXML format.

**Options:**

```typescript
interface Srt2FcpxOptions {
  titleName?: string;         // FCPXML project/sequence name
  formatVersion?: string;     // FCPXML format version (default: "1.8")
  frameRate?: number;         // Timeline frame rate (default: 24)
  width?: number;             // Frame width (default: 1920)
  height?: number;            // Frame height (default: 1080)
  fontFamily?: string;        // Font family name (default: "Helvetica")
  fontSize?: number;          // Font size in pixels (default: 72)
  textColor?: string;         // Text color (#RRGGBB or #RRGGBBAA)
  backgroundColor?: string;   // Background color
  lineSpacing?: number;       // Line spacing (default: 1.0)
}
```

### `parseSrt(source: string): SrtParseResult`

Parse SRT content into structured cues.

```typescript
interface SrtParseResult {
  cues: SrtCue[];       // Parsed subtitle cues
  errors: string[];     // Parse warnings
}

interface SrtCue {
  index: number;        // Sequential index
  startMs: number;      // Start time in milliseconds
  endMs: number;        // End time in milliseconds
  text: string;         // Subtitle text (may contain newlines)
}
```

## CLI Options

- `-o, --output <path>` - Output FCPXML file path (default: stdout)
- `-t, --title <name>` - Project title (default: "Converted from SRT")
- `-f, --fps <number>` - Frame rate (default: 24)
- `--width <number>` - Video width (default: 1920)
- `--height <number>` - Video height (default: 1080)
- `--font <name>` - Font family (default: "Helvetica")
- `--size <number>` - Font size (default: 72)
- `--face <name>` - Font face/weight (e.g., Regular, Bold, W8)
- `--color <hex>` - Text color (#RRGGBBAA, default: "#FFFFFFFF")
- `--bg <hex>` - Background color (#RRGGBBAA, default: "#00000000")
- `--stroke-color <hex>` - Stroke/outline color (#RRGGBBAA, default: "#000000FF")
- `--stroke-width <number>` - Stroke/outline width (default: 0)
- `--format-version <version>` - FCPXML format version (default: "1.8")
- `--config <file>` - Path to config file (overrides auto-discovery)

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and guidelines.

## License

MIT
