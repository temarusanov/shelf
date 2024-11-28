const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/trpc/**/*.ts',
      'packages/trpc/**/*.tsx',
      'packages/trpc/**/*.js',
      'packages/trpc/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/trpc/**/*.ts', 'packages/trpc/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/trpc/**/*.js', 'packages/trpc/**/*.jsx'],
    rules: {},
  },
];
