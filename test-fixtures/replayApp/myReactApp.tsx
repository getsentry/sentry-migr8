import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      blockSelector: '.my-blocks-selector,[my-block-attr]',
    }),
  ],
});

function myTsx() {
  return (
    <div>
      <div className="my-blocks-selector" />
    </div>
  );
}
