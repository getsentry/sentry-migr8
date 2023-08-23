import { severityFromString, getGlobalObject, timestampWithMs } from '@sentry/utils';
import * as SentryUtils from '@sentry/utils';

function doSomething() {
  const a = severityFromString('warning');
  const b = getGlobalObject();
  const c = SentryUtils.getGlobalObject();
  const d = timestampWithMs + 1000;
  const e = SentryUtils.timestampWithMs + 1000;
}
