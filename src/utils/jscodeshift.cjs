// These are utils for the transform.cjs files, which cannot require .js (esm) files

/**
 * Checks if a file content has a Sentry import or require.
 * By default checks for _any_ @sentry/xxx import, but you can also specify a package name.
 *
 * @param {string} source
 * @param {string | undefined} packageName
 * @returns {boolean}
 */
function hasSentryImportOrRequire(source, packageName = '@sentry/(.+)') {
  /* eslint-disable quotes */
  const importRegex = new RegExp(`from ['"]${packageName}['"]`, 'gim');
  const requireRegex = new RegExp(`require\\(['"]${packageName}['"]\\)`, 'gim');
  /* eslint-enable quotes */

  return importRegex.test(source) || requireRegex.test(source);
}

/**
 *
 * @param {import('jscodeshift')} j
 * @param {import('jscodeshift').Collection} tree
 * @param {string} source
 * @returns {undefined | import('jscodeshift').Collection<import('jscodeshift').CallExpression>}
 */
function getSentryInitExpression(j, tree, source) {
  // First try to find Sentry.init()
  const a = tree.find(j.CallExpression, {
    callee: { type: 'MemberExpression', object: { name: 'Sentry' }, property: { name: 'init' } },
  });

  if (a.size() > 0) {
    return a;
  }

  // Else try init() - only if the file contains an import for Sentry!
  if (hasSentryImportOrRequire(source)) {
    const b = tree.find(j.CallExpression, { callee: { type: 'Identifier', name: 'init' } });
    if (b.size() > 0) {
      return b;
    }
  }

  return undefined;
}

/**
 * Replaces `require("@sentry/<oldPackage>")` with `require("@sentry/<newPackage>")`
 *
 * @param {string} oldPackage the name of the old package
 * @param {string} newPackage the name of the new package
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 *
 * @returns {boolean} if something was changed
 */
function rewriteCjsRequires(oldPackage, newPackage, root, j) {
  let rewroteSomething = false;
  root
    .find(j.CallExpression)
    .filter(path => isCjsRequireCall(path) && requiresPackage(path, oldPackage))
    .forEach(path => {
      const firstArg = path.node.arguments[0];
      if (firstArg.type === 'StringLiteral') {
        firstArg.value = newPackage;
        rewroteSomething = true;
      }
    });
  return rewroteSomething;
}

/**
 * Replaces import syntax `from "<oldPackage>"` with `from "<newPackage>"`
 *
 * @param {string} oldPackage the name of the old package
 * @param {string} newPackage the name of the new package
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 *
 * @returns {import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} an array of old import import declarations
 */
function rewriteEsmImports(oldPackage, newPackage, root, j) {
  /** @type import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration>[]} */
  let oldImportPaths = [];
  root
    .find(j.ImportDeclaration)
    .filter(path => path.node.source.value === oldPackage)
    .forEach(path => {
      path.node.source.value = newPackage;
      oldImportPaths.push(path);
    });
  return oldImportPaths;
}

/**
 * Deduplicate imported identifiers.
 * E.g. `import { aa, aa, bb } from '@sentry/react';`
 * --> `import { aa, bb } from '@sentry/react';`
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection<any>} tree
 * @param {string} packageName
 */
function dedupeImportedIdentifiers(j, tree, packageName) {
  // First find imports
  tree.find(j.ImportDeclaration, { source: { type: 'StringLiteral', value: packageName } }).forEach(path => {
    const seen = new Set();

    const specifiers = path.value.specifiers || [];
    let pos = 0;
    while (pos < specifiers.length) {
      const specifier = specifiers[pos];
      if (specifier.type !== 'ImportSpecifier' || !specifier.local) {
        return;
      }

      const name = specifier.local.name;
      if (seen.has(name)) {
        specifiers.splice(pos, 1);
      } else {
        seen.add(name);
      }

      pos++;
    }

    path.value.specifiers = specifiers;
  });

  // Then find requires
  tree
    .find(j.VariableDeclaration, {
      declarations: [
        {
          type: 'VariableDeclarator',
          init: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
            arguments: [{ value: packageName }],
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
        const seen = new Set();

        const properties = requireVars.properties;
        let pos = 0;
        while (pos < properties.length) {
          const prop = properties[pos];
          if (prop.type !== 'ObjectProperty' || prop.value.type !== 'Identifier') {
            return;
          }

          const name = prop.value.name;
          if (seen.has(name)) {
            properties.splice(pos, 1);
          } else {
            seen.add(name);
          }

          pos++;
        }

        requireVars.properties = properties;
      }
    });
}

/**
 * Attempts to deduplicate import statements that import from the SDK package.
 * This is not perfect but it might cover the 80% case.
 * If we don't dedupe, users are left with potentially two or more import statements from
 * the SDK package, which is also fine.
 *
 * @param {string} packageName the name of the package whose imports should be deduped
 * @param {import('jscodeshift').Collection<any>} root
 * @param {import('jscodeshift').JSCodeshift} j
 */
function dedupeImportStatements(packageName, root, j) {
  const packageImports = root.find(j.ImportDeclaration).filter(path => path.node.source.value === packageName);

  const packageNameSpaceImports = packageImports.filter(
    p => p.node.specifiers?.length === 1 && p.node.specifiers[0].type === 'ImportNamespaceSpecifier'
  );
  /** { @type import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration> | undefined */
  const packageNamespaceImport = packageNameSpaceImports.length && packageNameSpaceImports.get(0);

  if (packageNamespaceImport) {
    const packageNamespace = packageNamespaceImport.node.specifiers?.[0].local?.name;
    if (!packageNamespace) {
      return;
    }
    const otherPackageImports = packageImports.filter(
      importDeclPath => importDeclPath.node !== packageNamespaceImport.node
    );
    // case 1: SDK import is a namespace import
    // e.g. import * as Sentry from '@sentry/browser';
    // Replace the formerly old package imports by adding the identifiers imported from the old package import to the SDK import
    otherPackageImports.forEach(otherPackageImportPath => {
      // case 1a: Old package import is a named import (e.g. import { BrowserTracing } from '@sentry/tracing')
      j(otherPackageImportPath)
        .find(j.ImportSpecifier)
        .filter(
          // for local name changes (e.g. import { BrowserTracing as Whatever } from '@sentry/tracing') we just bail
          specifier => !specifier.node.local?.name || specifier.node.local.name === specifier.node.imported.name
        )
        .forEach(specifier => {
          const id = specifier.node.imported.name;
          root
            .find(j.Identifier, { name: id })
            .filter(idPath => {
              return idPath.parentPath.value.type !== 'MemberExpression';
            })
            .forEach(idPath => {
              idPath.replace(j.memberExpression(j.identifier(packageNamespace), j.identifier(id)));
            });
          otherPackageImportPath.node.specifiers?.splice(
            otherPackageImportPath.node.specifiers.indexOf(specifier.node),
            1
          );
        });

      if (!otherPackageImportPath.node.specifiers?.length) {
        otherPackageImportPath.replace(undefined);
      }

      // case 1b: Old package import is a namespace import (e.g. import * as Tracing from '@sentry/tracing')
      j(otherPackageImportPath)
        .filter(t => t.node.specifiers?.length === 1)
        .find(j.ImportNamespaceSpecifier)
        .forEach(specifier => {
          const oldPackageNamespace = specifier.node.name?.name || specifier.node.local?.name;
          if (!oldPackageNamespace) {
            return;
          }

          root
            .find(j.Identifier, { name: oldPackageNamespace })
            .filter(p => {
              const parentType = p.parent.node.type;
              return parentType === 'MemberExpression' || parentType === 'TSQualifiedName';
            })
            .forEach(idPath => {
              idPath.replace(j.identifier(packageNamespace));
              otherPackageImportPath.replace(undefined);
            });
        });
    });

    return;
  }

  const namedPackageImports = packageImports.filter(importDecl => {
    return !!importDecl.node.specifiers?.find(specifier => specifier.type === 'ImportSpecifier');
  });
  /** { @type import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration> */
  const packageImportDeclarationWithNamedImportSpecifier =
    !packageNamespaceImport && namedPackageImports.length && namedPackageImports.get(0);

  if (packageImportDeclarationWithNamedImportSpecifier) {
    const otherPackageImports = packageImports.filter(
      importDeclPath => importDeclPath.node !== packageImportDeclarationWithNamedImportSpecifier.node
    );

    // case 2: Package import has named import specifier
    // e.g. import { init } from '@sentry/react';
    otherPackageImports.forEach(otherPackageImportPath => {
      const otherPackageImport = otherPackageImportPath.node;
      const isNamespaceOldPackageImport =
        otherPackageImport.specifiers?.length === 1 &&
        otherPackageImport.specifiers[0].type === 'ImportNamespaceSpecifier';

      // Case 2a: Old package import is not a namespace import
      // e.g. import { BrowserTracing } from '@sentry/tracing';
      // Replace the import declaration with adding the old package identifiers to the SDK import
      if (!isNamespaceOldPackageImport) {
        otherPackageImport.specifiers?.forEach(specifier => {
          packageImportDeclarationWithNamedImportSpecifier.node.specifiers?.push(specifier);
        });

        otherPackageImportPath.replace(undefined);
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
 * @param {string} packageName
 * @returns {boolean}
 */
function requiresPackage(path, packageName) {
  const args = path.node.arguments;
  return args.length === 1 && args[0].type === 'StringLiteral' && args[0].value === packageName;
}

/**
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} tree
 * @param {string} source
 * @param {string} packageName
 * @param {Map<string, string>} functionMap
 * @returns {boolean} True if it has replaced, else false
 */
function replaceFunctionCalls(j, tree, source, packageName, functionMap) {
  // If the file has no @sentry/nextjs import, nothing to do
  if (!hasSentryImportOrRequire(source, packageName)) {
    return false;
  }

  // Replace e.g. `severityFromString()` with `severityLevelFromString()`
  tree.find(j.CallExpression).forEach(path => {
    if (path.value.callee.type !== 'Identifier') {
      return;
    }

    const orig = path.value.callee.name;

    const replacement = functionMap.get(orig);

    if (replacement) {
      path.value.callee.name = replacement;
    }
  });

  // Replace e.g. `SentryUtuils.severityFromString()` with `SentryUtils.severityFromString()`
  tree.find(j.MemberExpression).forEach(path => {
    if (path.value.property.type !== 'Identifier') {
      return;
    }

    const orig = path.value.property.name;

    const replacement = functionMap.get(orig);

    if (replacement) {
      path.value.property.name = replacement;
    }
  });

  // Replace in import/require statements
  replaceImported(j, tree, source, packageName, functionMap);

  return true;
}

/**
 * Replace the names of imported/required properties, e.g. import {this,that} from 'package';
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} tree
 * @param {string} source
 * @param {string} packageName
 * @param {Map<string, string>} importMap
 * @returns {boolean} True if it has replaced, else false
 */
function replaceImported(j, tree, source, packageName, importMap) {
  // If the file has no @sentry/nextjs import, nothing to do
  if (!hasSentryImportOrRequire(source, packageName)) {
    return false;
  }

  // Replace imports of old APIs
  tree.find(j.ImportDeclaration, { source: { type: 'StringLiteral', value: packageName } }).forEach(path => {
    path.value.specifiers?.forEach(specifier => {
      if (specifier.type !== 'ImportSpecifier') {
        return;
      }

      const origImported = specifier.imported.name;
      const replacementImported = importMap.get(origImported);

      if (replacementImported) {
        specifier.imported.name = replacementImported;
      }

      // Also rewrite the local import, but only if it is the same
      if (specifier.local) {
        const origLocal = specifier.local.name;
        const replacementLocal = importMap.get(origLocal);

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
            arguments: [{ value: packageName }],
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
            const replacementValue = importMap.get(origValue);
            if (replacementValue) {
              property.key.name = replacementValue;
            }
          }

          // This is what it is imported as, e.g. const {x: y} = Sentry;
          if (property.value.type === 'Identifier') {
            const origValue = property.value.name;
            const replacementValue = importMap.get(origValue);
            if (replacementValue) {
              property.value.name = replacementValue;
            }
          }
        });
      }
    });

  dedupeImportedIdentifiers(j, tree, packageName);

  return true;
}

module.exports = {
  hasSentryImportOrRequire,
  rewriteCjsRequires,
  rewriteEsmImports,
  dedupeImportStatements,
  getSentryInitExpression,
  replaceFunctionCalls,
  replaceImported,
  requiresPackage,
  isCjsRequireCall,
};
