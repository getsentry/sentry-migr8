const { init: SentryInit } = require('@sentry/node');
const { addExtensionMethods } = require('@sentry/tracing');

SentryInit({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
