# srt2fcpx

## 0.0.2

### Patch Changes

- Add --quiet/-q option to suppress all output except errors

## 0.0.1

### Patch Changes

- b8d0385: Initial release of srt2fcpx

  Features:

  - Convert SRT subtitle files to Final Cut Pro FCPXML format
  - Multi-line subtitle support with preserved line breaks
  - Full Unicode support (Japanese, Chinese, emoji, etc.)
  - Customizable styling (font family, size, color, stroke)
  - Frame rate support (24, 30, 60fps and custom)
  - Template-based output preserving FCP-specific parameters
  - Config file support (.srt2fcpxrc.json or srt2fcpx.config.json)
  - CLI tool and Node.js library
  - FCPXML 1.8+ compatible
  - Tested with Final Cut Pro 11.2
