# @srt2fcpx/cli

Command-line tool for converting SRT subtitles to Final Cut Pro XML format.

## Installation

```bash
# Using pnpm (recommended)
pnpm add -g @srt2fcpx/cli

# Using npm
npm install -g @srt2fcpx/cli

# Using yarn
yarn global add @srt2fcpx/cli
```

## Usage

### Basic Usage

```bash
srt2fcpx input.srt
```

This will create `input.fcpxml` in the same directory.

### With Custom Options

```bash
srt2fcpx input.srt -o output.fcpxml -t "My Project" -f 30
```

### Full Example

```bash
srt2fcpx subtitles.srt \
  --output custom-output.fcpxml \
  --title "My Video Project" \
  --fps 30 \
  --width 3840 \
  --height 2160 \
  --font "Arial" \
  --size 100 \
  --color "#FFFF00FF" \
  --bg "#00000080"
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output <file>` | `-o` | Output FCPXML file | `<input>.fcpxml` |
| `--title <name>` | `-t` | Project title | "Converted from SRT" |
| `--fps <number>` | `-f` | Frame rate | 24 |
| `--width <number>` | | Video width (pixels) | 1920 |
| `--height <number>` | | Video height (pixels) | 1080 |
| `--font <name>` | | Font family | "Helvetica" |
| `--size <number>` | | Font size | 72 |
| `--color <hex>` | | Text color (#RRGGBBAA) | "#FFFFFFFF" |
| `--bg <hex>` | | Background color (#RRGGBBAA) | "#00000000" |
| `--format-version <version>` | | FCPXML format version | "1.8" |
| `--version` | `-V` | Show version number | |
| `--help` | `-h` | Show help | |

## Color Format

Colors are specified in hexadecimal format:
- `#RRGGBB` - RGB format (alpha defaults to 1.0)
- `#RRGGBBAA` - RGBA format (with alpha channel)

Examples:
- `#FFFFFFFF` - White (opaque)
- `#000000FF` - Black (opaque)
- `#FF0000FF` - Red (opaque)
- `#00000080` - Black (50% transparent)
- `#FFFF00FF` - Yellow (opaque)

## Importing to Final Cut Pro

1. Run the CLI to generate an FCPXML file
2. Open Final Cut Pro
3. Go to **File** → **Import** → **XML...**
4. Select the generated `.fcpxml` file
5. Subtitles will appear as title clips in your timeline

## Examples

### Convert with 30fps

```bash
srt2fcpx video.srt -f 30
```

### 4K Resolution

```bash
srt2fcpx video.srt --width 3840 --height 2160
```

### Custom Font and Size

```bash
srt2fcpx video.srt --font "Hiragino Sans" --size 80
```

### Yellow Text with Semi-transparent Background

```bash
srt2fcpx video.srt --color "#FFFF00FF" --bg "#00000080"
```

## Troubleshooting

### "No valid SRT cues found in input"

Your SRT file format may be incorrect. Check that:
- Each subtitle block has a number, timecode, and text
- Timecodes are in `HH:MM:SS,mmm --> HH:MM:SS,mmm` format
- Blocks are separated by empty lines

### Module not found

Make sure the package is installed globally:

```bash
pnpm install -g @srt2fcpx/cli
```

## License

MIT
