import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://example.com',
});

// do something now!
console.log('Hello, World!');
