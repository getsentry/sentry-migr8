import { Severity, other } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function doSomething() {
  const a = Severity.Fatal;
  const b = SpanStatus.UnknownError;
  const c = Sentry.Severity.Debug;
  const d = Sentry.SpanStatus.FailedPrecondition;
  const x = other();
}

enum SpanStatus {
  Fatal = 'fatal',
  UnknownError = 'unknown_error',
}
