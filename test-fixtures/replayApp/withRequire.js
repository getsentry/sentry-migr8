const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({
      block: ['.existing-block'],
      blockSelector: '.my-blocks-selector,[my-block-attr]',
      blockClass: 'my-block-class',
      ignoreClass: 'my-ignore-class',
      maskInputOptions: { email: true, text: false },
      maskTextClass: 'my-mask-text-class',
      maskTextSelector: '.my-mask-text-selector,[my-mask-text-attr]',
      other: "other",
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
