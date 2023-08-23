const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({
   	  tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
