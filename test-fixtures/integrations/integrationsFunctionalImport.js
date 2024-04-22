import * as Sentry from '@sentry/browser';
import { httpClientIntegration } from '@sentry/integrations';

function doSomething() {
  Sentry.init({
    integrations: [httpClientIntegration()]
  });
}
