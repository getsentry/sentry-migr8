import * as Sentry from '@sentry/browser';
import * as Hub from '@sentry/hub';
import { closeSession } from '@sentry/hub';
import type {Layer, Carrier} from '@sentry/hub';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = Hub.makeSession();

const hub = new Hub.Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop: Layer = hub.getStackTop();
Hub.makeMain(hub);

closeSession(s);
