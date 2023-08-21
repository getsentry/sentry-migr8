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
    },
    extends: ['@sentry-internal/sdk'],
    ignorePatterns: [],
    overrides: [],
  };
  