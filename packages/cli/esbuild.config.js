import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Alias plugin for TypeScript paths
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    // ~/* -> src/*
    build.onResolve({ filter: /^~\// }, args => {
      const relativePath = args.path.slice(2); // Remove ~/
      const resolved = path.resolve(__dirname, 'src', relativePath);

      // Try with .ts extension if file doesn't exist
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const pathWithExt = resolved + ext;
        if (existsSync(pathWithExt)) {
          return { path: pathWithExt };
        }
      }

      return { path: resolved };
    });
  },
};

// Build index.js (library entry point)
await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
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
  target: 'node20',
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
