const Sentry = require('@sentry/browser');

function doSomething() {
  Sentry.getCurrentHub().captureException(error);
  Sentry.getCurrentHub().setUser({ name: 'Anne' });
}
