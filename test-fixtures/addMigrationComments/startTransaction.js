import * as Sentry from '@sentry/browser';
import { startTransaction } from '@sentry/browser';

function doSomething() {
  startTransaction();
}

function doSomethingElse() {
  const transaction = Sentry.startTransaction();
  transaction.finish();

  const obj = {
    transaction: Sentry.startTransaction(),
  };
}
