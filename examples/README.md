# Examples

This directory contains usage examples and sample files for the srt2fcpx library.

## Directory Structure

```
examples/
├── input/              # Sample SRT files
│   ├── sample.srt      # Japanese subtitle sample
│   └── english-sample.srt  # English subtitle sample
├── output/             # Generated FCPXML files (gitignored)
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
