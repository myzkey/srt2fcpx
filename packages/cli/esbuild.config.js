import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Alias plugin for TypeScript paths
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // ~/* -> src/*
    build.onResolve({ filter: /^~\// }, args => ({
      path: path.resolve(__dirname, 'src', args.path.slice(2)),
    }));
  },
};

// Build index.js (library entry point)
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: true,
  plugins: [aliasPlugin],
  external: ['@srt2fcpx/core'],
});

// Build CLI
await esbuild.build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/cli.js',
  sourcemap: true,
  plugins: [aliasPlugin],
  external: ['@srt2fcpx/core', 'commander'],
});

// Add shebang to CLI file
const cliPath = path.join(__dirname, 'dist/cli.js');
const cliContent = readFileSync(cliPath, 'utf-8');
writeFileSync(cliPath, `#!/usr/bin/env node\n${cliContent}`);
chmodSync(cliPath, 0o755);

console.log('✓ CLI package bundled successfully');
