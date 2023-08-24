const { Severity, other, SpanStatus } = require('@sentry/browser');

function doSomething() {
  const a = Severity.Fatal;
  const b = SpanStatus.UnknownError;
  const c = Severity.ThisDoesNotExist;
  const d = SpanStatus.ThisDoesNotExist;
  const x = other();
}
