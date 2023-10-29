const { FlatCompat } = require('@eslint/eslintrc');
const baseConfig = require('../../eslint.config.js');
const js = require('@eslint/js');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});
module.exports = [
  ...baseConfig,
  {
    files: [
      'packages/schematics/**/*.ts',
      'packages/schematics/**/*.tsx',
      'packages/schematics/**/*.js',
      'packages/schematics/**/*.jsx',
    ],
    rules: {},
  },
  {
    files: ['packages/schematics/**/*.ts', 'packages/schematics/**/*.tsx'],
    rules: {},
  },
  {
    files: ['packages/schematics/**/*.js', 'packages/schematics/**/*.jsx'],
    rules: {},
  },
  ...compat.config({ parser: 'jsonc-eslint-parser' }).map((config) => ({
    ...config,
    files: [
      'packages/schematics/package.json',
      'packages/schematics/generators.json',
      'packages/schematics/executors.json',
    ],
    rules: { '@nx/nx-plugin-checks': 'error' },
  })),
];
