const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/create-workspace/**/*.ts',
      'packages/create-workspace/**/*.tsx',
      'packages/create-workspace/**/*.js',
      'packages/create-workspace/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/create-workspace/**/*.ts', 'packages/create-workspace/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/create-workspace/**/*.js', 'packages/create-workspace/**/*.jsx'],
    rules: {},
  },
];
