const { init } = require('@sentry/node');
const { addExtensionMethods } = require('@sentry/tracing');

init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
