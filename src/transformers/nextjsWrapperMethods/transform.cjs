const { adapt } = require('jscodeshift-adapters');

const { replaceFunctionCalls } = require('../../utils/jscodeshift.cjs');

const FunctionMap = new Map([
  ['withSentryAPI', 'wrapApiHandlerWithSentry'],
  ['withSentryServerSideGetInitialProps', 'wrapGetInitialPropsWithSentry'],
  ['withSentryServerSideAppGetInitialProps', 'wrapAppGetInitialPropsWithSentry'],
  ['withSentryServerSideDocumentGetInitialProps', 'wrapDocumentGetInitialPropsWithSentry'],
  ['withSentryServerSideErrorGetInitialProps', 'wrapErrorGetInitialPropsWithSentry'],
  ['withSentryGetServerSideProps', 'wrapGetServerSidePropsWithSentry'],
  ['withSentryGetStaticProps', 'wrapGetStaticPropsWithSentry'],
  ['withSentry', 'wrapApiWithSentry'],
  ['withSentryServerSideAppGetInitialProps', 'wrapAppGetInitialPropsWithSentry'],
]);

/**
 * This transform converts old Next.js wrapper methods to their new format.
 *
 * Transforms:
 * `withSentryAPI` → `wrapApiHandlerWithSentry`
 * `withSentryServerSideGetInitialProps` → `wrapGetInitialPropsWithSentry`
 * `withSentryServerSideAppGetInitialProps` → `wrapAppGetInitialPropsWithSentry`
 * `withSentryServerSideDocumentGetInitialProps` → `wrapDocumentGetInitialPropsWithSentry`
 * `withSentryServerSideErrorGetInitialProps` → `wrapErrorGetInitialPropsWithSentry`
 * `withSentryGetServerSideProps` → `wrapGetServerSidePropsWithSentry`
 * `withSentryGetStaticProps` → `wrapGetStaticPropsWithSentry`
 * `withSentry` → `wrapApiWithSentry`
 * `withSentryServerSideAppGetInitialProps` → `wrapAppGetInitialPropsWithSentry`
 *
 * @type {import('jscodeshift').Transform}
 */
function nextJsWrapperMethods(fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;

  const tree = j(source);

  if (!replaceFunctionCalls(j, tree, source, '@sentry/nextjs', FunctionMap)) {
    return undefined;
  }

  return tree.toSource();
}

module.exports = adapt(nextJsWrapperMethods);
