const { getCurrentHub } = require('@sentry/browser');

function doSomething() {
  getCurrentHub().captureException(error);
  getCurrentHub().setUser({ name: 'Anne' });
  const client = getCurrentHub().getClient();
  const scope = getCurrentHub().getScope();
  const isolationScope = getCurrentHub().getIsolationScope();
  getCurrentHub().captureSession({});
  getCurrentHub().startSession();
  getCurrentHub().endSession();
  getCurrentHub().run(() => {
    // do something
  });
  getCurrentHub().withScope(scope => {
    // do something
  });
  getCurrentHub().setExtra({});
  getCurrentHub().setContext({});
  const integration = getCurrentHub().getIntegration('MyIntegration');

  getCurrentHub().bindClient(client);
  const scope2 = getCurrentHub().pushScope();
  getCurrentHub().popScope();
}

function doSomethingElse() {
  const hub = getCurrentHub();
  const otherHubHere = getCurrentHub();

  hub.setExtra({});
  otherHubHere.captureEvent({});
}
