const { replaceFunctionCalls } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

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
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    if (!replaceFunctionCalls(j, tree, source, '@sentry/nextjs', FunctionMap)) {
      return undefined;
    }

    return tree.toSource();
  });
};
