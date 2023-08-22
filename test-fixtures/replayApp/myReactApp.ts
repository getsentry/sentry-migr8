import * as Sentry from '@sentry/react';

const Replay = Sentry.Replay as any;
const replay = new Replay({
  blockSelector: '.my-blocks-selector,[my-block-attr]',
  blockClass: 'my-block-class',
  ignoreClass: 'my-ignore-class',
  maskInputOptions: { email: true, text: false },
  maskTextClass: 'my-mask-text-class',
  maskTextSelector: '.my-mask-text-selector,[my-mask-text-attr]',
  sessionSampleRate: 0.1,
  errorSampleRate: 0.75,
});

Sentry.init({
  integrations: [replay],
});
