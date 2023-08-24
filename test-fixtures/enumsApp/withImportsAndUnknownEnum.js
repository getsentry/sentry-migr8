import { Severity, other, SpanStatus } from '@sentry/browser';

function doSomething() {
  const a = Severity.Fatal;
  const b = SpanStatus.UnknownError;
  const c = Severity.ThisDoesNotExist;
  const d = SpanStatus.ThisDoesNotExist;
  const x = other();
}
