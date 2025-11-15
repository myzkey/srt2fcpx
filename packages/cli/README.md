# srt2fcpx

Convert SRT subtitle files to Final Cut Pro FCPXML format.

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

- `titleName` - FCPXML project/sequence name
- `formatVersion` - FCPXML format version (default: "1.8")
- `frameRate` - Timeline frame rate (default: 24)
- `width` - Frame width (default: 1920)
- `height` - Frame height (default: 1080)
- `fontFamily` - Font family name (default: "Helvetica")
- `fontSize` - Font size in pixels (default: 72)
- `textColor` - Text color in #RRGGBB or #RRGGBBAA format
- `backgroundColor` - Background color
- `lineSpacing` - Line spacing (default: 1.0)

### `parseSrt(source: string): SrtParseResult`

Parse SRT content into structured cues.

## CLI Options

- `-o, --output <path>` - Output FCPXML file path (default: stdout)
- `-t, --title-name <name>` - FCPXML project/sequence name
- `--format-version <version>` - FCPXML format version (default: "1.8")
- `--frame-rate <fps>` - Timeline frame rate (e.g., 24, 25, 29.97, 30)
- `--width <px>` - Frame width in pixels (default: 1920)
- `--height <px>` - Frame height in pixels (default: 1080)
- `--font-family <name>` - Font family name
- `--font-size <px>` - Font size in pixels
- `--text-color <hex>` - Text color (#RRGGBB or #RRGGBBAA)
- `--bg-color <hex>` - Background color
- `--line-spacing <value>` - Line spacing
- `--dry-run` - Parse only, do not generate XML
- `-v, --verbose` - Verbose output
- `-q, --quiet` - Suppress non-error output

## License

MIT
