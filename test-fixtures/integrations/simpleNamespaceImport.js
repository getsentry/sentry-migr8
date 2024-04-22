import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.init({
    integrations: [new Sentry.BrowserTracing()]
  });
}
