const Sentry = require('@sentry/browser');
const Hub = require('@sentry/hub');
const { makeMain } = require('@sentry/hub');
const { closeSession } = require('@sentry/hub');

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = Hub.makeSession();

const hub = new Hub.Hub(Hub.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop = hub.getStackTop();
makeMain(hub);

closeSession(s);
