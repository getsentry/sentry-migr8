import * as Sentry from '@sentry/browser';
import { getActiveTransaction } from '@sentry/browser';

function doSomething() {
  getActiveTransaction();
}

function doSomethingElse() {
  const transaction = Sentry.getActiveTransaction();
  transaction.finish();

  const obj = {
    transaction: Sentry.getActiveTransaction(),
  };
}
