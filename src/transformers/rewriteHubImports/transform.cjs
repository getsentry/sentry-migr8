const { dedupeImportStatements, hasSentryImportOrRequire, rewriteCjsRequires } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

const SENTRY_HUB_PACKAGE = '@sentry/hub';
const SENTRY_CORE_PACKAGE = '@sentry/core';

const APIS_ONLY_IN_CORE = [
  'getMainCarrier',
  'setHubOnCarrier',
  'SessionFlusher',
  'closeSession',
  'makeSession',
  'updateSession',
  'Carrier',
  'Layer',
];

/**
 * Previously, the `Replay` integration needed to be installed and imported
 * from a separate package (`@sentry/replay`). This is no longer necessary
 * with more recent SDK versions, where we export the integration directly
 * from the (browser) SDK packages.
 *
 * TODO: CJS!!
 *
 * This transform rewrites imports from `@sentry/replay` to be imported from the SDK package.
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function transform(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  if (!hasSentryImportOrRequire(source, SENTRY_HUB_PACKAGE)) {
    return undefined;
  }

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const root = j(source, options);

    /** @type {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} */
    const sdkImportsToDedupe = [];
    /** @type {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} */
    const coreImportsToDedupe = [];

    let shouldInstallCore = false;

    // Pass 1: Replace mixed named hub imports with imports from the SDK package and @sentry/core
    // e.g. import { makeSession, Hub } from '@sentry/hub' -> import { makeSession } from '@sentry/core'; import { Hub } from '@sentry/browser'
    findHubImports(root, j).forEach(importPath => {
      if (!importPath.node.specifiers) {
        return;
      }
      if (importPath.node.specifiers.find(specifier => specifier.type !== 'ImportSpecifier')) {
        // wo don't handle namespace imports here
        // plus, we ignore default imports because our SDKs have no default exports
        return;
      }

      const coreSpecifiers = importPath.node.specifiers?.filter(spec =>
        APIS_ONLY_IN_CORE.includes(spec?.id?.name || spec?.local?.name || '')
      );
      const sdkSpecifiers = importPath.node.specifiers?.filter(
        spec => !APIS_ONLY_IN_CORE.includes(spec?.id?.name || spec?.local?.name || '')
      );

      if (coreSpecifiers.length) {
        shouldInstallCore = true;
        const coreImportDecl = j.importDeclaration(coreSpecifiers, j.literal(SENTRY_CORE_PACKAGE));
        importPath.insertBefore(coreImportDecl);
        coreImportsToDedupe.push(j(coreImportDecl).get(0));
      }
      if (sdkSpecifiers.length) {
        const sdkImportDecl = j.importDeclaration(sdkSpecifiers, j.literal(options.sentry.sdk));
        importPath.insertBefore(sdkImportDecl);
        sdkImportsToDedupe.push(j(sdkImportDecl).get(0));
      }

      importPath.replace(undefined);
    });

    // Pass 2: Replace namespace imports from @sentry/hub with imports from @sentry/core
    findHubImports(root, j).forEach(importPath => {
      if (
        importPath.node.specifiers?.length !== 1 ||
        importPath.node.specifiers[0].type !== 'ImportNamespaceSpecifier'
      ) {
        return;
      }
      // This is cheap but it's not easy to determine what properties are actually used from the namespace import
      // so let's just default to import from Core for now.
      importPath.node.source.value = SENTRY_CORE_PACKAGE;
      shouldInstallCore = true;
    });

    dedupeImportStatements(options.sentry.sdk, root, j);
    dedupeImportStatements(SENTRY_CORE_PACKAGE, root, j);

    // Pass 3 (or 1 for CJS): Replace require('@sentry/hub') with require('@sentry/core')
    // The same thing as in pass 2 applies here basically. It's easier to just rewrite to @sentry/core
    // than figuring out which of the declarators use APIs that could have been exported from the SDK package
    shouldInstallCore = shouldInstallCore || rewriteCjsRequires(SENTRY_HUB_PACKAGE, SENTRY_CORE_PACKAGE, root, j);

    if (shouldInstallCore) {
      // @ts-ignore - it's ugly but it'll work...
      options.sentry._needsCore = true;
    }

    return root.toSource();
  });
};

/**
 * Finds imports from `@sentry/hub`
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 */
function findHubImports(root, j) {
  return root.find(j.ImportDeclaration, { source: { value: SENTRY_HUB_PACKAGE } });
}
