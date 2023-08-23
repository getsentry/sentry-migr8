const { rewriteEsmImports, rewriteCjsRequires, dedupeImportStatements } = require('../../utils/jscodeshift.cjs');

const SENTRY_TRACING_PACKAGE = '@sentry/tracing';

/**
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function transform(fileInfo, api, options) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source, options);

  // 1. Replace tracing import with SDK import
  const tracingImportPaths = rewriteEsmImports(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);

  // 2. Dedupe imports
  if (tracingImportPaths.length > 0) {
    dedupeImportStatements(options.sentry.sdk, tracingImportPaths, root, j);
  }

  rewriteCjsRequires(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);

  // TODO: dedupe requires. We can do it but for now I'm gonna skip it.
  //       ending up with duplicated requires/imports is not the end of the world.

  return root.toSource();
};
