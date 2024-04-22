import { init, BrowserTracing } from '@sentry/browser';

function doSomething() {
  init({
    integrations: [new BrowserTracing()]
  });
}
