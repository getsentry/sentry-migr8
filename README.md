# sentry-migr8

HACKWEEK PROJECT - Migrate to the next JS SDK version

## Usage

- Clone the git project: `git clone git@github.com:getsentry/sentry-migr8.git`
- Run it in your applications directory: `node ~/path/to/sentry-migr8/src/index.js`

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
