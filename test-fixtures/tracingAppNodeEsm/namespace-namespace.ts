import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
} as Sentry.NodeOptions);

Tracing.addExtensionMethods();

let txn: Tracing.Transaction | undefined;
txn = Sentry.startTransaction({
  name: 'test',
});

txn.finish();

function dontTouchThis() {
  const Tracing = 'foo';
  console.log(Tracing);
}
