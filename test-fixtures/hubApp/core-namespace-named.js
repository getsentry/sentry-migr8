import * as Sentry from '@sentry/browser';
import { makeSession, closeSession } from '@sentry/hub';


Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

doSomethingExpensive();

closeSession(s);
