const Sentry = require('@sentry/browser');

function doSomething() {
  Sentry.init({
    integrations: [new Sentry.BrowserTracing()]
  });
}
