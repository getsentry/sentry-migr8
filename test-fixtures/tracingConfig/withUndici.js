const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.Undici({
   	  tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
