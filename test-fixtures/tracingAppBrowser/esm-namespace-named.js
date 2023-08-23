import * as Sentry from '@sentry/browser';
import { BrowserTracing, addExtensionMethods, TRACEPARENT_REGEXP} from '@sentry/tracing';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
  integrations: [new BrowserTracing()],
});

addExtensionMethods();

console.log(TRACEPARENT_REGEXP)
