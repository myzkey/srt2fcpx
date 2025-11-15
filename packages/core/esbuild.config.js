import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
