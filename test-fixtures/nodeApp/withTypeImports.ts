import { Handlers } from '@sentry/node';
import * as Sentry from '@sentry/node';

export function doSomething(input: Handlers.ExpressRequest): Sentry.Handlers.ExpressRequest {
  Handlers.doSomethingElse();
  return {} as Handlers.ExpressRequest;
}
