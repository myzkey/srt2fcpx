import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to fix fixtures path for bundled code
const fixFixturesPath = {
  name: 'fix-fixtures-path',
  setup(build) {
    build.onLoad({ filter: /builder\.ts$/ }, async (args) => {
      let contents = await readFile(args.path, 'utf8');
      // In bundled code, fixtures will be at dist/fixtures (same level as dist/index.js)
      // So change from "../fixtures" to "fixtures"
      // Try both single and double quotes
      contents = contents.replace(
        /join\(currentDir,\s*['"]\.\.['"],\s*['"]fixtures['"]\)/g,
        'join(currentDir, "fixtures")'
      );
      return { contents, loader: 'ts' };
    });
  },
};

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['commander', 'chalk'],
  alias: {
    '@srt2fcpx/core': path.resolve(__dirname, '../core/src/index.ts'),
  },
  plugins: [fixFixturesPath],
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
