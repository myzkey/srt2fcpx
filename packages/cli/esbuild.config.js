import * as esbuild from 'esbuild';

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
});

console.log('✓ CLI package bundled successfully');
