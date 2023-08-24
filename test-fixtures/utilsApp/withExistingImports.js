import { severityFromString, severityLevelFromString, other } from '@sentry/utils';

function doSomething() {
  const a = severityFromString('warning');
  const b = severityLevelFromString('warning');
  const c = other();
}
