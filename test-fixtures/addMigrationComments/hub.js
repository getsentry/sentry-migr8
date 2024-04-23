import * as Sentry from '@sentry/browser';
import { makeMain, Hub } from '@sentry/browser';

function doSomething() {
  const hub = new Hub();
  makeMain(hub);
}

function doSomethingElse() {
  const hub = new Sentry.Hub();
  Sentry.makeMain(hub);
}
