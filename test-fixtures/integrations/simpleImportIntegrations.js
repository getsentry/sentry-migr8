import * as Sentry from '@sentry/browser';
import { HttpClient } from '@sentry/integrations';

function doSomething() {
  Sentry.init({
    integrations: [new HttpClient()]
  });
}
