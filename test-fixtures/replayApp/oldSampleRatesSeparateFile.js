import * as Sentry from '@sentry/react';

const replay = new Sentry.Replay({
  sessionSampleRate: 0.1,
  errorSampleRate: 0.75,
  blockClass: 'my-block-class',
});
