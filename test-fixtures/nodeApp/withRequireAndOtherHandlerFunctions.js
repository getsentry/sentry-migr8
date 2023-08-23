const { Handlers, other } = require('@sentry/node');

Handlers.extractRequestData();
Handlers.tracingHandler();
other.extractRequestData();
