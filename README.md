# sentry-migr8

HACKWEEK PROJECT - Migrate to the next JS SDK version

## Usage

- Clone the git project: `git clone git@github.com:getsentry/sentry-migr8.git`
- Run it in your applications directory: `node ~/path/to/sentry-migr8/src/index.js`

By default we run all transformations on all files in the directory, ignoring any gitignored files.

### Options

You can run `node ~/path/to/sentry-migr8/src/index.js --help` to get a list of available options.

- `--filePatterns`: Glob pattern(s) which files should be transformed. Defaults to `**/*.{js,jsx,ts,tsx,mjs,cjs,mts}`
- `--debug`: Enable verbose logging
- `--sdk`: We try to detect the used Sentry SDK package, e.g. `@sentry/browser`. You can overwrite this and provide the
  SDK package you're using.
- `--cwd`: You can overwrite the cwd dir to run commands in.

## Transformations

### Replay Config v7>v8

This migrates deprecated replay configuration from v7 to v8. This includes:

- `blockSelector` → `block`
- `blockClass` → `block`
- `ignoreClass` → `ignore`
- `maskTextClass` → `mask`
- `maskTextSelector` → `mask`

It also migrates old sample rate config from `new Replay()` to `Sentry.init()`:

```
Sentry.init({
  integrations: [
    new Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.8
    })
  ]
});
// Becomes...
Sentry.init({
  integrations: [
    new Replay({})
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.8,
});
```

### Remove deprecated packaes

Removes deprecated packages (`@sentry/hub`, `@sentry/tracing` and `@sentry/replay`) from your application. These are not
needed anymore, and their exports can just be imported from your main SDK package instead.

### Update SDK to latest version

Updates your used SDK to the latest version, and ensures all packages have the same version.

### Next.js Wrapper Methods v7>v8

This migrates deprecated Next.js methods from v7 to v8. This includes:

- `withSentryAPI` → `wrapApiHandlerWithSentry`
- `withSentryServerSideGetInitialProps` → `wrapGetInitialPropsWithSentry`
- `withSentryServerSideAppGetInitialProps` → `wrapAppGetInitialPropsWithSentry`
- `withSentryServerSideDocumentGetInitialProps` → `wrapDocumentGetInitialPropsWithSentry`
- `withSentryServerSideErrorGetInitialProps` → `wrapErrorGetInitialPropsWithSentry`
- `withSentryGetServerSideProps` → `wrapGetServerSidePropsWithSentry`
- `withSentryGetStaticProps` → `wrapGetStaticPropsWithSentry`
- `withSentry` → `wrapApiWithSentry`
- `withSentryServerSideAppGetInitialProps` → `wrapAppGetInitialPropsWithSentry`
