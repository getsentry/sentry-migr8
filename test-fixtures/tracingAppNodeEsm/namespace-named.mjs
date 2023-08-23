import * as Sentry from '@sentry/node';
import { addExtensionMethods } from '@sentry/tracing';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
