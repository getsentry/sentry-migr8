import * as Sentry from '@sentry/react';
import { Replay } from '@sentry/replay';

Sentry.init({
  integrations: [
    new Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
