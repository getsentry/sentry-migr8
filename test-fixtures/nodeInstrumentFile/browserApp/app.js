import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://example.com',
});

// do something now!
console.log('Hello, World!');
