import {init, Replay, BrowserTracing} from '@sentry/react';

init({
  integrations: [
    new Replay({}),
    new BrowserTracing({
      tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
