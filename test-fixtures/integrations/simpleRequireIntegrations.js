const Sentry = require('@sentry/browser');
const { HttpClient } = require('@sentry/integrations');

function doSomething() {
  Sentry.init({
    integrations: [new HttpClient()]
  });
}
