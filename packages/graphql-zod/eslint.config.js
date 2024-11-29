const baseConfig = require('../../eslint.config.js');
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/graphql-zod/**/*.ts',
      'packages/graphql-zod/**/*.tsx',
      'packages/graphql-zod/**/*.js',
      'packages/graphql-zod/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/graphql-zod/**/*.ts', 'packages/graphql-zod/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/graphql-zod/**/*.js', 'packages/graphql-zod/**/*.jsx'],
    rules: {},
  },
];
