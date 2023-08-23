import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({
   	  tracingOrigins: ['asdas', /regex/gmi]
    })
  ],
});
