// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [ 
      // Ignore generated distribution
      '**/dist/**',
      // Ignore tool config files
      '*.config.js',
      '*.cjs',
      // Ignore mongo init scripts
      'mongo/*.js',
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
  ...tseslint.configs.stylistic,
  {
    rules: {
      // Types vs interfaces is a style choice
      "@typescript-eslint/consistent-type-definitions": "off"
    }
  },
);