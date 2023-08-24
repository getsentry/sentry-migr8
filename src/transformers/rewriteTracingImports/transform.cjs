const {
  rewriteEsmImports,
  rewriteCjsRequires,
  dedupeImportStatements,
  hasSentryImportOrRequire,
} = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

const SENTRY_TRACING_PACKAGE = '@sentry/tracing';

/**
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function transform(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  if (!hasSentryImportOrRequire(source, '@sentry/tracing')) {
    return undefined;
  }

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const root = j(source, options);

    // 1. Replace tracing import with SDK import
    rewriteEsmImports(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);
    dedupeImportStatements(options.sentry.sdk, root, j);

    // 2. Replace tracing require with SDK require
    rewriteCjsRequires(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);

    // TODO: dedupe requires. We can do it but for now I'm gonna skip it.
    //       ending up with duplicated requires/imports is not the end of the world.

    return root.toSource();
  });
};
