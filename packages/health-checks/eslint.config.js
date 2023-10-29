const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/health-checks/**/*.ts',
      'packages/health-checks/**/*.tsx',
      'packages/health-checks/**/*.js',
      'packages/health-checks/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: [
      'packages/health-checks/**/*.ts',
      'packages/health-checks/**/*.tsx',
    ],
    rules: {},
  },
  {
    files: [
      'packages/health-checks/**/*.js',
      'packages/health-checks/**/*.jsx',
    ],
    rules: {},
  },
];
