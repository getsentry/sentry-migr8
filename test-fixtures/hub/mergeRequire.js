const { getCurrentHub } = require('@sentry/browser');
const Sentry = require('@sentry/browser');

function doSomething() {
  getCurrentHub().captureException(error);
  Sentry.getCurrentHub().setUser({ name: 'Anne' });
}
