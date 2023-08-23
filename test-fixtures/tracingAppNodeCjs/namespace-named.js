const Sentry = require('@sentry/node');
const { addExtensionMethods } = require('@sentry/tracing');

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
