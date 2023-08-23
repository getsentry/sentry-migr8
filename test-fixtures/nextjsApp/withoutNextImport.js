import { withSentryAPI, withSentryServerSideGetInitialProps as myRewrite, otherImport } from '@sentry/OTHER';
import * as Sentry from '@sentry/OTHER';

function orig() {
  // do something
}

function doSomething() {
  withSentryAPI(orig, 'arg1');
  myRewrite(orig, 'arg2');
  Sentry.withSentryServerSideErrorGetInitialProps(orig, 'arg2');

  Sentry.withSentryAPI(orig, 'arg2');
  Sentry.withSentryServerSideGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideAppGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideDocumentGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideErrorGetInitialProps(orig, 'arg2');
  Sentry.withSentryGetServerSideProps(orig, 'arg2');
  Sentry.withSentryGetStaticProps(orig, 'arg2');
  Sentry.withSentry(orig, 'arg2');
  Sentry.withSentryServerSideAppGetInitialProps(orig, 'arg2');

  Sentry.someOtherMethod(orig, 'arg2');
  otherImport(orig, 'arg2');
}
