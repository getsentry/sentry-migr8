# sentry-migr8

HACKWEEK PROJECT - Migrate to the next JS SDK version

**This Package is highly experimental! Use with Caution!**

## Usage

Run `@sentry/migr8` in your application directory:

```sh
npx @sentry/migr8
```

By default we run all transformations on all files in the directory, ignoring any gitignored files.

If you work in a monorepo, make sure to run `@sentry/migr8` in each subpackage instead of the monorepo root, as
otherwise we cannot update dependencies etc. correctly.

### Options

You can run `npx @sentry/migr8 --help` to get a list of available options.

- `--filePatterns`: Glob pattern(s) which files should be transformed. Defaults to
  `**/*.{js,jsx,ts,tsx,mjs,cjs,mts,.vue,.svele}`
- `--ignoreFilePatterns`: Glob pattern(s) which files should be ignored. This overwrites files matched by
  `--filePatterns`.
- `--debug`: Enable verbose logging
- `--sdk`: We try to detect the used Sentry SDK package, e.g. `@sentry/browser`. You can overwrite this and provide the
  SDK package you're using.
- `--cwd`: You can overwrite the cwd dir to run commands in.

## Transformations

### Add migration comments

There are certain things that migr8 cannot auto-fix for you. This is the case for things like `startTransaction()`,
which cannot be replaced 1:1. This transform will try to identify the most common of these scenarios, and put comments
into your code in places where you need to do something manually.

### Use functional integrations instead of integration classes

This updates usage of class-based integrations to the new, functional style. For example:

- `new BrowserTracing()` → `browserTracingIntegration()`
- `new Sentry.Replay()` → `Sentry.replayIntegration()`

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

### Remove deprecated packages

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

### Node Handler Utils v7>v8

Rewrite moved utility functions from `Sentry.Handlers.xxx`. Note that this does not migrate _all_ methods on `Handlers`,
but only a few that have been deprecated:

- `Handlers.ExpressRequest` → `PolymorphicRequest` (Type export)
- `Handlers.extractRequestData` → `extractRequestData`

### Use getCurrentScope() instead of configureScope()

Rewrites usages of `configureScope()` to use `getCurrentScope()` instead. Note that this will rewrite this to code
blocks, which may not be the preferred syntax in all cases, but it's the only way to make this work somewhat reliably
with avoiding variable clashes etc.

This will rewrite:

```js
Sentry.configureScope(scope => {
  scope.setTag('ccc', 'ccc');
  scope.setExtra('ddd', { ddd: 'ddd' });
});
```

to

```js
{
  const scope = Sentry.getCurrentScope();
  scope.setTag('ccc', 'ccc');
  scope.setExtra('ddd', { ddd: 'ddd' });
}
```

### Tracing Config v7>v8

Rewrites `tracePropagationTargets` and `tracingOrigins` from Integration-level config to root config on `Sentry.init()`.

### Util Exports v7>v8

Rewrites some old exports from `@sentry/utils` to their newer formats:

- `severityFromString` → `severityLevelFromString`
- `getGlobalObject()` → `GLOBAL_OBJ`
- `timestampWithMs` → `timestampInSeconds`

### Convert Enums to String Literals

Replaces the deprecated `Sentry.Severity` and `Sentry.SpanStatus` enums with their string literal values.

### Remove `@sentry/hub` imports

Replaces imports from the deprecated `@sentry/hub` package with the newer imports.

### Remove `@sentry/replay` imports

Replaces imports from the deprecated `@sentry/replay` package with the newer imports.

### Remove `@sentry/tracing` imports

Replaces imports from the deprecated `@sentry/tracing` package with the newer imports.
