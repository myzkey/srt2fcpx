import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/cli.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Bundle @srt2fcpx/core but keep other packages external
  external: ['commander', 'chalk'],
  alias: {
    '@srt2fcpx/core': path.resolve(__dirname, '../core/src/index.ts'),
  },
});

console.log('✓ CLI package bundled successfully');
