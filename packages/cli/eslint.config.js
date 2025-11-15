import baseConfig from '@srt2fcpx/eslint-config';

export default [
  ...baseConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
      '*.config.ts',
    ],
  },
];
