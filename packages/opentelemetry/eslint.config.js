const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/opentelemetry/**/*.ts',
      'packages/opentelemetry/**/*.tsx',
      'packages/opentelemetry/**/*.js',
      'packages/opentelemetry/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: [
      'packages/opentelemetry/**/*.ts',
      'packages/opentelemetry/**/*.tsx',
    ],
    rules: {},
  },
  {
    files: [
      'packages/opentelemetry/**/*.js',
      'packages/opentelemetry/**/*.jsx',
    ],
    rules: {},
  },
];
