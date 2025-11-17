# Quick Start

## Try It Now

```bash
# 1. Build the project
pnpm install
pnpm build

# 2. Convert a sample file
pnpm srt2fcpx examples/input/sample.srt

# Generated file: sample.fcpxml
```

## Try with Custom Options

```bash
# 30fps, custom font, yellow subtitles
pnpm srt2fcpx examples/input/english-sample.srt \
  -t "My Video" \
  -f 30 \
  --font "Arial" \
  --size 100 \
  --color "#FFFF00FF" \
  -o examples/output/my-output.fcpxml
```

## Import to Final Cut Pro

1. Open Final Cut Pro
2. Select **File** → **Import** → **XML...**
3. Select the generated `.fcpxml` file
4. Subtitles will appear on the timeline

## Available Options

View all options:
```bash
pnpm srt2fcpx --help
```

Main options:
- `-t, --title` - Project name
- `-f, --fps` - Frame rate (24, 30, 60, etc.)
- `--font` - Font family
- `--size` - Font size
- `--color` - Text color (#RRGGBBAA)
- `--bg` - Background color (#RRGGBBAA)
- `--width`, `--height` - Resolution

## Learn More

- [Examples README](./examples/README.md) - Samples and detailed usage
- [CLI README](./packages/cli/README.md) - CLI documentation
- [Main README](./README.md) - API reference and development guide
