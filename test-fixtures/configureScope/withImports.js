import { configureScope } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function orig() {
  // do something
}

function doSomething() {
  configureScope((scope) => {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });

  configureScope(function (scope) {
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  });

  configureScope(orig);

  Sentry.configureScope((scope) => {
    scope.setTag('ccc', 'ccc');
    scope.setExtra('ddd', { ddd: 'ddd' });
  });
}
