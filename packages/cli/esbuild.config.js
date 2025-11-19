import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['commander', 'chalk'],
  alias: {
    '@srt2fcpx/core': path.resolve(__dirname, '../core/src/index.ts'),
  },
};

// Build CLI
await esbuild.build({
  ...commonConfig,
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/cli.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
});

// Build library entry point
await esbuild.build({
  ...commonConfig,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
});

console.log('✓ CLI package bundled successfully');
