import * as Sentry from '@sentry/browser';
import { startTransaction } from '@sentry/browser';

function doSomething() {
  // TODO(sentry): Use `startInactiveSpan()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  startTransaction();
}

function doSomethingElse() {
  // TODO(sentry): Use `startInactiveSpan()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  const transaction = Sentry.startTransaction();
  transaction.finish();

  const obj = {
    // TODO(sentry): Use `startInactiveSpan()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
    transaction: Sentry.startTransaction(),
  };
}
