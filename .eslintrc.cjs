// Note: All paths are relative to the directory in which eslint is being run, rather than the directory where this file
// lives

// ESLint config docs: https://eslint.org/docs/user-guide/configuring/

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['tsconfig.json'],
  },
  extends: ['@sentry-internal/sdk'],
  overrides: [
    {
      files: ['*.js', '*.ts', '*.cjs'],
      rules: {
        '@sentry-internal/sdk/no-nullish-coalescing': 'off',
        '@sentry-internal/sdk/no-optional-chaining': 'off',
        '@sentry-internal/sdk/no-unsupported-es6-methods': 'off',
      },
    },
    {
      files: ['test-helpers/**/*.js', 'test-fixtures/**/*.{js,ts}', 'src/**/*.test.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['test-fixtures/**/*.{js,ts}'],
      rules: {
        'import/no-unresolved': 'off',
        // To avoid errors for e.g. `Sentry.init()`
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  ],
};
