import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

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

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: true,
  plugins: [aliasPlugin],
  external: [], // No external dependencies for core
});

console.log('✓ Core package bundled successfully');
