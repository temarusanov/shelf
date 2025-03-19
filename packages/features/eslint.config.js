const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/nats/**/*.ts',
      'packages/nats/**/*.tsx',
      'packages/nats/**/*.js',
      'packages/nats/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/nats/**/*.ts', 'packages/nats/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/nats/**/*.js', 'packages/nats/**/*.jsx'],
    rules: {},
  },
];
