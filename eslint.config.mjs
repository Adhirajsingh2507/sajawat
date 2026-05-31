import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import base from '@sajawat/config/eslint/base';
import react from '@sajawat/config/eslint/react';
import typeChecked from '@sajawat/config/eslint/type-checked';

/**
 * Root ESLint flat config — single source of truth for the whole monorepo.
 *
 * ESLint v9 resolves one config by ascending from the cwd, so a single root
 * config keeps `turbo run lint` (per-package) and `lint-staged` (from repo
 * root) in perfect agreement. Rules are scoped by `files`:
 *   - packages/** , services/**  -> shared base (TS)
 *   - packages/ui/**             -> base + React layer
 *   - apps/**                    -> eslint-config-next + our cross-cutting rules
 */
export default defineConfig([
  globalIgnores([
    '**/dist/**',
    '**/.next/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/next-env.d.ts',
    '**/*.config.{js,cjs,mjs,ts}',
    'eslint.config.mjs',
    'commitlint.config.cjs',
    'prettier.config.js',
  ]),

  // TypeScript libraries, services, and type packages.
  {
    files: ['packages/**/*.{ts,tsx}', 'services/**/*.{ts,tsx}'],
    extends: [base],
  },

  // Backend service — type-aware layer on top of base. Requires the TypeScript
  // program; `projectService` resolves each file to its nearest tsconfig
  // (services/api/tsconfig.json) with the repo root as the resolution anchor.
  {
    files: ['services/api/**/*.ts'],
    extends: [typeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Shared React component library.
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    extends: [react],
  },

  // Next.js applications.
  {
    files: ['apps/**/*.{ts,tsx}'],
    extends: [nextVitals, nextTs],
  },

  // Cross-cutting rules applied to apps on top of Next's config (reuses Next's
  // @typescript-eslint registration; do not re-add the base TS plugin here).
  {
    files: ['apps/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportDeclaration[source.value='express'][importKind!='type'] > ImportSpecifier[importKind!='type']",
          message:
            "CJS interop: import express as default then destructure — `import express from 'express'; const { Router } = express;`",
        },
        {
          selector:
            "ImportDeclaration[source.value='mongoose'][importKind!='type'] > ImportSpecifier[importKind!='type']",
          message:
            "CJS interop: import mongoose as default then destructure — `import mongoose from 'mongoose'; const { Schema } = mongoose;`",
        },
      ],
    },
  },
]);
