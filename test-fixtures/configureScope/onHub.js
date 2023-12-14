import { getCurrentHub } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function orig() {
  // do something
}

function doSomething() {
  Sentry.getCurrentHub().configureScope((scope) => {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });

  getCurrentHub().configureScope((scope) => {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });

  const hub = Sentry.getCurrentHub();
  hub.configureScope((scope) => {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });

  const currentHub = Sentry.getCurrentHub();
  currentHub.configureScope((scope) => {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });
}
