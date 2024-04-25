import { getCurrentHub } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function doSomething() {
  getCurrentHub().captureException(error);
  Sentry.getCurrentHub().setUser({ name: 'Anne' });
}
