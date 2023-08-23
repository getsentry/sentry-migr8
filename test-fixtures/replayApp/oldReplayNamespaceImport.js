import * as Sentry from '@sentry/react';
import * as SentryReplay from '@sentry/replay';

Sentry.init({
  integrations: [
    new SentryReplay.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
