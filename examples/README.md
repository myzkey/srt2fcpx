# Examples

This directory contains usage examples and sample files for the srt2fcpx library.

## Directory Structure

```
examples/
├── input/              # Sample SRT files
│   ├── sample.srt      # Japanese subtitle sample
│   └── english-sample.srt  # English subtitle sample
├── output/             # Generated FCPXML files (gitignored)
├── srt2fcpx.config.json    # Example config file
├── .srt2fcpxrc.example.json  # Alternative config example
└── convert.mjs         # Conversion script
```

## Usage

### Basic Conversion

```bash
node convert.mjs input/sample.srt
```

This will generate `sample.fcpxml` in the current directory.

### Conversion with Custom Options

```bash
# Specify project name and frame rate
node convert.mjs input/sample.srt --title "My Video" --fps 30

# Customize font
node convert.mjs input/sample.srt --font "Hiragino Sans" --size 80

# Change resolution (4K)
node convert.mjs input/sample.srt --width 3840 --height 2160

# Specify text color and background
node convert.mjs input/sample.srt --color "#FFFFFFFF" --bg "#00000080"

# Specify output file (save to output directory)
node convert.mjs input/sample.srt --output output/my-output.fcpxml

# Combine multiple options
node convert.mjs input/english-sample.srt \
  --title "English Subtitles" \
  --fps 30 \
  --font "Arial" \
  --size 100 \
  --color "#FFFF00FF" \
  --output output/english.fcpxml
```

### Using Configuration Files

The CLI automatically discovers and uses configuration files. This directory includes example config files:

**`srt2fcpx.config.json`** - Full configuration example with all available options:

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

**`.srt2fcpxrc.example.json`** - Minimal configuration example:

```json
{
  "title": "Converted from SRT",
  "fps": 24,
  "font": "Arial",
  "size": 80,
  "color": "#FFFF00FF"
}
```

When you run the CLI in this directory, it will automatically load `srt2fcpx.config.json`:

```bash
# Uses settings from srt2fcpx.config.json
node convert.mjs input/sample.srt -o output/configured.fcpxml
```

You can override config file settings with CLI options:

```bash
# Config file has fps: 30, this overrides to 60
node convert.mjs input/sample.srt -o output/override.fcpxml --fps 60
```

You can specify a custom config file:

```bash
# Use .srt2fcpxrc.example.json instead
node convert.mjs input/sample.srt --config .srt2fcpxrc.example.json
```

**Config file discovery priority:**
1. `.srt2fcpxrc.json` in current directory
2. `srt2fcpx.config.json` in current directory
3. `.srt2fcpxrc.json` in home directory

**Option priority:** CLI options > Config file > Default values

## Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--title <name>` | Project name | "Converted from SRT" |
| `--fps <number>` | Frame rate | 24 |
| `--width <number>` | Video width (pixels) | 1920 |
| `--height <number>` | Video height (pixels) | 1080 |
| `--font <name>` | Font family | "Helvetica" |
| `--size <number>` | Font size | 72 |
| `--color <hex>` | Text color (#RRGGBBAA) | "#FFFFFFFF" |
| `--bg <hex>` | Background color (#RRGGBBAA) | "#00000000" |
| `--output <file>` | Output file name | `<input>.fcpxml` |

## Color Format

Colors are specified in hexadecimal format:
- `#RRGGBB` - RGB format (alpha defaults to 1.0)
- `#RRGGBBAA` - RGBA format (alpha can be specified)

Examples:
- `#FFFFFFFF` - White (opaque)
- `#000000FF` - Black (opaque)
- `#FF0000FF` - Red (opaque)
- `#00000080` - Black (semi-transparent)
- `#FFFFFF00` - White (fully transparent)

## Using with Final Cut Pro

1. Run the script to generate an FCPXML file
2. Launch Final Cut Pro
3. Select "File" → "Import" → "XML..."
4. Select the generated `.fcpxml` file
5. Subtitles will be imported as title clips on the timeline

## Troubleshooting

### Error: "No valid SRT cues found in input"

The SRT file format may be incorrect. Please check:
- Each subtitle block consists of number, timecode, and text in that order
- Timecode format is `HH:MM:SS,mmm --> HH:MM:SS,mmm`
- There is a blank line between each block

### Error: "Cannot find module '@srt2fcpx/core'"

Packages are not installed. Run the following in the project root:

```bash
pnpm install
```
