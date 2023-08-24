import * as Sentry from '@sentry/node';
import { setTag } from '@sentry/node';
import { addExtensionMethods, startTransaction } from '@sentry/tracing';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

setTag('shouldBePrefixed', true);

addExtensionMethods();

const transaction = startTransaction({ name: 'test-transaction' });

Sentry.configureScope(scope => {
  scope.setSpan(transaction);
});

transaction.setTag('shouldBePrefixed', false)

doLongRunningThing();

transaction.finish();
