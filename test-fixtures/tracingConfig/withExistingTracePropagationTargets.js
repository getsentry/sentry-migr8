import * as Sentry from '@sentry/react';

Sentry.init({
  tracePropagationTargets: ['existing', /other/gmi],
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
