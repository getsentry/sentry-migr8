const {
  rewriteEsmImports,
  rewriteCjsRequires,
  dedupeImportStatements,
  hasSentryImportOrRequire,
} = require('../../utils/jscodeshift.cjs');

const SENTRY_REPLAY_PACKAGE = '@sentry/replay';

/**
 * Previously, the `Replay` integration needed to be installed and imported
 * from a separate package (`@sentry/replay`). This is no longer necessary
 * with more recent SDK versions, where we export the integration directly
 * from the (browser) SDK packages.
 *
 * This transform rewrites imports from `@sentry/replay` to be imported from the SDK package.
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function transform(fileInfo, api, options) {
  if (!hasSentryImportOrRequire(fileInfo.source, '@sentry/replay')) {
    return undefined;
  }

  const j = api.jscodeshift;
  const root = j(fileInfo.source, options);

  // 1. Replace tracing import with SDK import
  const tracingImportPaths = rewriteEsmImports(SENTRY_REPLAY_PACKAGE, options.sentry.sdk, root, j);

  // 2. Dedupe imports
  if (tracingImportPaths.length > 0) {
    dedupeImportStatements(options.sentry.sdk, tracingImportPaths, root, j);
  }

  rewriteCjsRequires(SENTRY_REPLAY_PACKAGE, options.sentry.sdk, root, j);

  // TODO: dedupe requires. We can do it but for now I'm gonna skip it.
  //       ending up with duplicated requires/imports is not the end of the world.

  return root.toSource();
};
