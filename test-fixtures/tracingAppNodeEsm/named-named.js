import { init } from '@sentry/node';
import { addExtensionMethods } from '@sentry/tracing';

init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
