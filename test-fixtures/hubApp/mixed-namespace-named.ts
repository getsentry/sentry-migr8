import * as Sentry from '@sentry/browser';
import { Hub, makeMain, closeSession } from '@sentry/hub';
import { makeSession, } from '@sentry/hub';
import type {Layer, Carrier} from '@sentry/hub';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

const hub = new Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop: Layer = hub.getStackTop();
makeMain(hub);

closeSession(s);
