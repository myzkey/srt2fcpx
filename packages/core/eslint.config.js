import baseConfig from '@srt2fcpx/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'tests/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
];
