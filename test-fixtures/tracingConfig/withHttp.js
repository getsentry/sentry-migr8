const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.Http({
   	  tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
