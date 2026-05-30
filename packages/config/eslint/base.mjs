import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * Shared base ESLint flat config for TypeScript packages
 * (node libraries, services, type packages).
 *
 * Enforces:
 *  - eslint:recommended + typescript-eslint:recommended (includes no-explicit-any)
 *  - consistent-type-imports (pairs with verbatimModuleSyntax)
 *  - CJS interop rule: forbid named imports from Express / Mongoose
 */
export default tseslint.config(js.configs.recommended, ...tseslint.configs.recommended, {
  languageOptions: {
    globals: { ...globals.node },
  },
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "ImportDeclaration[source.value='express'] > ImportSpecifier",
        message:
          "CJS interop: import express as default then destructure — `import express from 'express'; const { Router } = express;`",
      },
      {
        selector: "ImportDeclaration[source.value='mongoose'] > ImportSpecifier",
        message:
          "CJS interop: import mongoose as default then destructure — `import mongoose from 'mongoose'; const { Schema } = mongoose;`",
      },
    ],
  },
});
