import * as Sentry from '@sentry/browser';
import { Hub, makeMain, closeSession, getCurrentHub } from '@sentry/hub';
import { makeSession,  } from '@sentry/hub';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

const hub = new Hub(getCurrentHub().getClient(), getCurrentHub().getScope());
makeMain(hub);

closeSession(s);
