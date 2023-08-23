import {init, Replay} from '@sentry/react';

init({
  integrations: [
    new Replay({
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
