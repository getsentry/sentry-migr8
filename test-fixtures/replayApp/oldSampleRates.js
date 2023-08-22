import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
