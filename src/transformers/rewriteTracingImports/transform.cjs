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
  let tracingImportPaths = rewriteEsmImports(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);

  // 2. Dedupe imports
  if (tracingImportPaths.length > 0) {
    dedupeImportStatements(options.sentry.sdk, tracingImportPaths, root, j);
  }

  rewriteCjsRequires(SENTRY_TRACING_PACKAGE, options.sentry.sdk, root, j);

  // TODO: dedupe requires. We can do it but for now I'm gonna skip it.
  //       ending up with duplicated requires/imports is not the end of the world.

  return root.toSource();
};

/**
 * Replaces `require("@sentry/<oldPackage>")` with `require("@sentry/<newPackage>")`
 *
 * @param {string} oldPackage the name of the old package
 * @param {string} newPackage the name of the new package
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 */
function rewriteCjsRequires(oldPackage, newPackage, root, j) {
  root
    .find(j.CallExpression)
    .filter(path => isCjsRequireCall(path) && requiresOldPackage(path, oldPackage))
    .forEach(path => {
      const firstArg = path.node.arguments[0];
      if (firstArg.type === 'StringLiteral') {
        firstArg.value = newPackage;
      }
    });
}

/**
 * Replaces import syntax `from "<oldPackage>"` with `from "<newPackage>"`
 *
 * @param {string} oldPackage the name of the old package
 * @param {string} newPackage the name of the new package
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 *
 * @returns {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} an array of tracing import declarations
 */
function rewriteEsmImports(oldPackage, newPackage, root, j) {
  /** @type import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} */
  let tracingImportPaths = [];
  root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === oldPackage)
    .forEach(path => {
      path.node.source.value = newPackage;
      tracingImportPaths.push(path);
    });
  return tracingImportPaths;
}

/**
 * Attempts to deduplicate import statements that import from the SDK package.
 * This is not perfect but it might cover the 80% case.
 * If we don't dedupe, users are left with potentially two or more import statements from
 * the SDK package, which is also fine.
 *
 * @param {string} sdkPackage
 * @param {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} tracingImportPaths
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 */
function dedupeImportStatements(sdkPackage, tracingImportPaths, root, j) {
  const sdkImports = root.find(j.ImportDeclaration).filter(path => path.node.source.value === sdkPackage);

  const hasSdkNamespaceImport = sdkImports.find(j.ImportNamespaceSpecifier).length > 0;

  if (hasSdkNamespaceImport) {
    const sdkNameSpace = sdkImports.find(j.ImportNamespaceSpecifier).find(j.Identifier).nodes()[0].name;
    // case 1: SDK import is a namespace import
    // e.g. import * as Sentry from '@sentry/browser';
    // Replace the tracing import by adding the SDK namespace to the identifiers imported from tracing
    tracingImportPaths.forEach(tracingImportPath => {
      // case 1a: Tracing import is a named import (e.g. import { BrowserTracing } from '@sentry/tracing')
      j(tracingImportPath)
        .find(j.ImportSpecifier)
        .filter(
          // for local name changes (e.g. import { BrowserTracing as Whatever } from '@sentry/tracing') we just bail
          specifier => !specifier.node.local?.name || specifier.node.local.name === specifier.node.imported.name
        )
        .forEach(specifier => {
          const id = specifier.node.imported.name;
          root.find(j.Identifier, { name: id }).forEach(idPath => {
            idPath.replace(j.memberExpression(j.identifier(sdkNameSpace), j.identifier(id)));
          });
          tracingImportPath.replace(undefined);
        });

      // case 1b: Tracing import is a namespace import (e.g. import * as Tracing from '@sentry/tracing')
      j(tracingImportPath)
        .filter(t => t.node.specifiers?.length === 1)
        .find(j.ImportNamespaceSpecifier)
        .forEach(specifier => {
          const tracingNamespace = specifier.node.name?.name || specifier.node.local?.name;
          if (!tracingNamespace) {
            return;
          }

          root
            .find(j.Identifier, { name: tracingNamespace })
            .filter(p => {
              const parentType = p.parent.node.type;
              return parentType === 'MemberExpression' || parentType === 'TSQualifiedName';
            })
            .forEach(idPath => {
              idPath.replace(j.identifier(sdkNameSpace));
              tracingImportPath.replace(undefined);
            });
        });
    });
  }

  const sdkImportDeclarationWithNamedImportSpecifier =
    !hasSdkNamespaceImport &&
    sdkImports
      .filter(importDecl => {
        const node = importDecl.node;
        return !!node.specifiers?.find(specifier => specifier.type === 'ImportSpecifier');
      })
      .nodes()[0];

  if (sdkImportDeclarationWithNamedImportSpecifier) {
    // case 2: SDK import has named import specifier
    // e.g. import { init } from '@sentry/react';
    tracingImportPaths.forEach(tracingImportPath => {
      const tracingImport = tracingImportPath.node;
      const isNamespaceTracingImport =
        tracingImport.specifiers?.length === 1 && tracingImport.specifiers[0].type === 'ImportNamespaceSpecifier';

      // Case 2a: Tracing import is not a namespace import
      // e.g. import { BrowserTracing } from '@sentry/tracing';
      // Replace the import declaration with the tracing import
      if (!isNamespaceTracingImport) {
        tracingImport.specifiers?.forEach(specifier => {
          sdkImportDeclarationWithNamedImportSpecifier.specifiers?.push(specifier);
        });

        tracingImportPath.replace(undefined);
      }
    });
  }
}

/**
 *
 * @param {import('jscodeshift').ASTPath<import('jscodeshift').CallExpression>} path
 * @returns {boolean}
 */
function isCjsRequireCall(path) {
  return path.node.callee.type === 'Identifier' && path.node.callee.name === 'require';
}

/**
 *
 * @param {import('jscodeshift').ASTPath<import('jscodeshift').CallExpression>} path
 * @param {string} oldPackageName
 * @returns {boolean}
 */
function requiresOldPackage(path, oldPackageName) {
  const args = path.node.arguments;
  return args.length === 1 && args[0].type === 'StringLiteral' && args[0].value === oldPackageName;
}
