const { hasSentryImportOrRequire } = require('../../utils/jscodeshift.cjs');

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
  const tree = j(source);

  // If the file has no @sentry/nextjs import, nothing to do
  if (!hasSentryImportOrRequire(source, '@sentry/nextjs')) {
    return undefined;
  }

  // Replace e.g. `withSentryAPI()` with `wrapApiHandlerWithSentry()`
  tree.find(j.CallExpression).forEach(path => {
    if (path.value.callee.type !== 'Identifier') {
      return;
    }

    const orig = path.value.callee.name;

    const replacement = FunctionMap.get(orig);

    if (replacement) {
      path.value.callee.name = replacement;
    }
  });

  // Replace e.g. `Sentry.withSentryAPI()` with `Sentry.wrapApiHandlerWithSentry()`
  tree.find(j.MemberExpression).forEach(path => {
    if (path.value.property.type !== 'Identifier') {
      return;
    }

    const orig = path.value.property.name;

    const replacement = FunctionMap.get(orig);

    if (replacement) {
      path.value.property.name = replacement;
    }
  });

  // Replace imports of old APIs
  tree.find(j.ImportDeclaration, { source: { type: 'StringLiteral', value: '@sentry/nextjs' } }).forEach(path => {
    path.value.specifiers?.forEach(specifier => {
      if (specifier.type !== 'ImportSpecifier') {
        return;
      }

      const origImported = specifier.imported.name;
      const replacementImported = FunctionMap.get(origImported);

      if (replacementImported) {
        specifier.imported.name = replacementImported;
      }

      // Also rewrite the local import, but only if it is the same
      if (specifier.local) {
        const origLocal = specifier.local.name;
        const replacementLocal = FunctionMap.get(origLocal);

        if (replacementLocal) {
          specifier.local.name = replacementLocal;
        }
      }
    });
  });

  // Replace require of old APIs
  tree
    .find(j.VariableDeclaration, {
      declarations: [
        {
          type: 'VariableDeclarator',
          init: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ value: '@sentry/nextjs' }],
          },
        },
      ],
    })
    .forEach(path => {
      if (
        path.value.declarations[0].type === 'VariableDeclarator' &&
        path.value.declarations[0].id.type === 'ObjectPattern'
      ) {
        const requireVars = path.value.declarations[0].id;

        requireVars.properties.forEach(property => {
          if (property.type !== 'ObjectProperty') {
            return;
          }

          // This is what is imported, e.g. const {x} = Sentry;
          if (property.key.type === 'Identifier') {
            const origValue = property.key.name;
            const replacementValue = FunctionMap.get(origValue);
            if (replacementValue) {
              property.key.name = replacementValue;
            }
          }

          // This is what it is imported as, e.g. const {x: y} = Sentry;
          if (property.value.type === 'Identifier') {
            const origValue = property.value.name;
            const replacementValue = FunctionMap.get(origValue);
            if (replacementValue) {
              property.value.name = replacementValue;
            }
          }
        });
      }
    });

  return tree.toSource();
};
