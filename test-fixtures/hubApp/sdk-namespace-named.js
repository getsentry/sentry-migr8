import * as Sentry from '@sentry/browser';
import { Hub, makeMain } from '@sentry/hub';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const hub = new Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
makeMain(hub);

