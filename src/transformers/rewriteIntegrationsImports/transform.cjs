const { adapt } = require('jscodeshift-adapters');

const {
  dedupeImportStatements,
  hasSentryImportOrRequire,
  rewriteCjsRequires,
  rewriteEsmImports,
} = require('../../utils/jscodeshift.cjs');

const SENTRY_INTEGRATIONS_PACKAGE = '@sentry/integrations';

/**
 * This transform rewrites imports from `@sentry/integrations` to be imported from the SDK package.
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
function rewriteIntegrationsImports(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const sdk = options.sentry.sdk;

  if (!hasSentryImportOrRequire(fileInfo.source, SENTRY_INTEGRATIONS_PACKAGE) || !sdk) {
    return undefined;
  }

  const root = j(source, options);

  // 1. Replace import with SDK import
  const importPaths = rewriteEsmImports(SENTRY_INTEGRATIONS_PACKAGE, sdk, root, j);

  // 2. Dedupe imports
  if (importPaths.length > 0) {
    dedupeImportStatements(sdk, root, j);
  }

  // 3. Replace requires
  rewriteCjsRequires(SENTRY_INTEGRATIONS_PACKAGE, sdk, root, j);

  return root.toSource();
}

module.exports = adapt(rewriteIntegrationsImports);
