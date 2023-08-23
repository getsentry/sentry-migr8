const { Handlers, other, myOtherImport } = require('@sentry/node');
const Sentry = require('@sentry/node');

Handlers.extractRequestData();
Sentry.Handlers.extractRequestData();
other.extractRequestData();
myOtherImport();

