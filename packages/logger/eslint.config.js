const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/logger/**/*.ts',
      'packages/logger/**/*.tsx',
      'packages/logger/**/*.js',
      'packages/logger/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/logger/**/*.ts', 'packages/logger/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/logger/**/*.js', 'packages/logger/**/*.jsx'],
    rules: {},
  },
];
