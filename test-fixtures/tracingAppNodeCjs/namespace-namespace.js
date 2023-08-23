const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

Tracing.addExtensionMethods();

let txn;
txn = Sentry.startTransaction({
  name: 'test',
});

txn.finish();

function dontTouchThis() {
  const Tracing = 'foo';
  console.log(Tracing);
}
