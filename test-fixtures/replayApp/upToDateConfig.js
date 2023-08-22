import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      block: ['.existing-block'],
      ignore: ['.my-ignore-class'],
      mask: ['.my-mask-class'],
      useCompression: true
    }),
  ],
});

