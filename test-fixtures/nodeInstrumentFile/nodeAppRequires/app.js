const { init, setTag, getActiveSpan } = require('@sentry/node');
const { something, somethingElse } = require('other-package');

init({
  dsn: 'https://example.com',
  beforeSend(event) {
    event.extra.hasSpan = !!getActiveSpan();
    event.extra.check = something();
    return event;
  }
});

setTag('key', 'value');

// do something now!
console.log('Hello, World!', somethingElse.doThis());
