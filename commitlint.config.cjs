/**
 * Commitlint configuration — enforces `type(scope): description`
 * per docs/sajawat-coding-standards.md (GIT COMMIT FORMAT).
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'docs', 'style', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // domain scopes
        'auth', 'users', 'products', 'categories', 'collections', 'inventory',
        'orders', 'payments', 'cart', 'coupons', 'reviews', 'wishlist',
        'crm', 'cms', 'blogs', 'notifications', 'analytics', 'settings', 'audit',
        // surface scopes
        'web', 'admin', 'api', 'ui', 'types', 'shared', 'config',
        // meta scopes
        'repo', 'ci', 'docs', 'deps', 'phase-0',
      ],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
  },
};
