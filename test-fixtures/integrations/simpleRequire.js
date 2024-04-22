const { init, BrowserTracing } = require('@sentry/browser');

function doSomething() {
  init({
    integrations: [new BrowserTracing()]
  });
}
