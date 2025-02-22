// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [ 
      // Ignore generated distribution
      '**/dist/**',
      // Ignore tool config files
      '*.config.js',
      '*.cjs',
      '*config.js',
      // Ignore mongo init scripts
      'mongo/**/*.js',
    ],
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      // Types vs interfaces is a style choice
      "@typescript-eslint/consistent-type-definitions": "off"
    }
  },
);