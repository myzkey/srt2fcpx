# srt2fcpx

## 0.0.7

### Patch Changes

- 0169fb4: Migrate from ESLint to Biome and improve tooling

  - Replace ESLint + Prettier with Biome for faster linting and formatting
  - Configure code style: single quotes, minimal semicolons, 2-space indent
  - Fix standalone bundle fixtures path resolution
  - Upgrade GitHub Actions to use setup-node@v5 for reliable npm publishing
  - Remove all ESLint dependencies and configuration

## 0.0.6

### Patch Changes

- d07584d: Fix standalone package by properly bundling @srt2fcpx/core with fixtures templates

## 0.0.5

### Patch Changes

- 327bad1: Fix standalone package by bundling @srt2fcpx/core with required fixtures templates

## 0.0.4

### Patch Changes

- 539c5f2: Fix package to work as standalone by properly bundling @srt2fcpx/core into both CLI and library entry points

## 0.0.3

### Patch Changes

- bceb131: Bundle @srt2fcpx/core into CLI package to fix npm install errors for external users

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
