import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://example.com' as string,
});

// do something now!
console.log('Hello, World!');
