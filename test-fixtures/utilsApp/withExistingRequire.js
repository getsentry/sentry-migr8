const { severityFromString, severityLevelFromString, other } = require('@sentry/utils');

function doSomething() {
  const a = severityFromString('warning');
  const b = severityLevelFromString();
  const c = other();
}
