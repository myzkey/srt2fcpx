#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { convertSrtToFcpxml } from '@srt2fcpx/core';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node convert.mjs <input.srt> [options]

Options:
  --title <name>        Project title (default: "Converted from SRT")
  --fps <number>        Frame rate (default: 24)
  --width <number>      Video width (default: 1920)
  --height <number>     Video height (default: 1080)
  --font <name>         Font family (default: "Helvetica")
  --size <number>       Font size (default: 72)
  --color <hex>         Text color (default: "#FFFFFFFF")
  --bg <hex>            Background color (default: "#00000000")
  --output <file>       Output file (default: <input>.fcpxml)

Examples:
  node convert.mjs input/sample.srt
  node convert.mjs input/sample.srt --title "My Project" --fps 30
  node convert.mjs input/sample.srt --output output/result.fcpxml
`);
  process.exit(0);
}

const inputFile = args[0];
const options = {};

// Parse command line arguments
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];

  switch (flag) {
    case '--title':
      options.titleName = value;
      break;
    case '--fps':
      options.frameRate = Number(value);
      break;
    case '--width':
      options.width = Number(value);
      break;
    case '--height':
      options.height = Number(value);
      break;
    case '--font':
      options.fontFamily = value;
      break;
    case '--size':
      options.fontSize = Number(value);
      break;
    case '--color':
      options.textColor = value;
      break;
    case '--bg':
      options.backgroundColor = value;
      break;
    case '--output':
      // Handle separately
      break;
  }
}

try {
  // Read SRT file
  const srtContent = readFileSync(resolve(inputFile), 'utf-8');

  console.log(`📖 Reading: ${inputFile}`);

  // Convert to FCPXML
  const fcpxml = convertSrtToFcpxml(srtContent, options);

  // Determine output file
  const outputIndex = args.indexOf('--output');
  let outputFile;
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    outputFile = args[outputIndex + 1];
  } else {
    const inputBasename = basename(inputFile, '.srt');
    outputFile = `${inputBasename}.fcpxml`;
  }

  // Write FCPXML file
  writeFileSync(resolve(outputFile), fcpxml, 'utf-8');

  console.log(`✅ Converted successfully!`);
  console.log(`📝 Output: ${outputFile}`);

  if (Object.keys(options).length > 0) {
    console.log(`⚙️  Options:`, options);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
