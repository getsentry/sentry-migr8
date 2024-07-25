const { adapt } = require('jscodeshift-adapters');

const {
  rewriteEsmImports,
  dedupeImportStatements,
  hasSentryImportOrRequire,
  rewriteCjsRequires,
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
function rewriteReplayImports(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const sdk = options.sentry.sdk;

  if (!hasSentryImportOrRequire(fileInfo.source, SENTRY_REPLAY_PACKAGE) || !sdk) {
    return undefined;
  }

  const root = j(source, options);

  // 1. Replace import with SDK import
  const importPaths = rewriteEsmImports(SENTRY_REPLAY_PACKAGE, sdk, root, j);

  // 2. Dedupe imports
  if (importPaths.length > 0) {
    dedupeImportStatements(sdk, root, j);
  }

  // 3. Replace requires
  rewriteCjsRequires(SENTRY_REPLAY_PACKAGE, sdk, root, j);

  return root.toSource();
}

module.exports = adapt(rewriteReplayImports);
