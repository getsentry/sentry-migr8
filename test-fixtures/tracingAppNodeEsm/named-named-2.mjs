import { init as SentryInit } from '@sentry/node';
import { addExtensionMethods } from '@sentry/tracing';

SentryInit({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
