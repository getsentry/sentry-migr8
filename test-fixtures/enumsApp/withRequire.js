const { Severity, other, SpanStatus } = require('@sentry/browser');
const Sentry =  require('sentry/browser');

function doSomething() {
  const a = Severity.Fatal;
  const b = SpanStatus.UnknownError;
  const c = Sentry.Severity.Debug;
  const d = Sentry.SpanStatus.FailedPrecondition;
  const x = other();
}
