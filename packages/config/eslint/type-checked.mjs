import tseslint from 'typescript-eslint';

/**
 * Type-aware ESLint layer (Milestone 0.4).
 *
 * Layered ON TOP of `base` for the async-heavy backend (`services/api`). Uses
 * the TypeScript program (via `projectService`) so rules that need type
 * information can run. The consumer must set `languageOptions.parserOptions`
 * `{ projectService: true, tsconfigRootDir }` in the root config so each file
 * resolves to its nearest tsconfig.
 *
 * Enforces (beyond base):
 *  - typescript-eslint:recommendedTypeChecked
 *  - no-floating-promises  — every Promise must be awaited/handled
 *  - no-misused-promises   — no Promises passed where void is expected
 *    (e.g. async Express handlers used without an error-forwarding wrapper)
 */
export default tseslint.config(...tseslint.configs.recommendedTypeChecked, {
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
  },
});
