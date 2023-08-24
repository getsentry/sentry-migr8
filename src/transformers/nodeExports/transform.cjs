const { hasSentryImportOrRequire } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

/**
 * This transform converts old Node `Handler.xxx` utilities to their new format.
 *
 * Transforms:
 * `Handlers.ExpressRequest` --> `PolymorphicRequest`
 * `Handlers.extractRequestData` --> `extractRequestData`
 *
 * For now, does not handle `Handlers.ParseRequestOptions` and `Handlers.parseRequest` (as that is less straightforward)
 *
 * @type {import('jscodeshift').Transform}
 */
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  // If the file has no @sentry/node import, nothing to do
  if (!hasSentryImportOrRequire(source, '@sentry/node')) {
    return undefined;
  }

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    // Replace Sentry.Handlers.xxx with Sentry.xxx
    tree
      .find(j.MemberExpression, {
        object: { type: 'MemberExpression', object: { name: 'Sentry' }, property: { name: 'Handlers' } },
      })
      .forEach(path => {
        if (path.value.property.type !== 'Identifier') {
          return;
        }

        const orig = path.value.property.name;

        if (orig === 'extractRequestData') {
          path.value.object = j.identifier('Sentry');
        }
      });

    let shouldRemoveHandlersImport = true;
    /** @type {Set<string>} */
    let importsToAdd = new Set();

    // Replace Handlers.xxx with xxx
    tree.find(j.MemberExpression, { object: { name: 'Handlers' } }).forEach(path => {
      if (path.value.property.type !== 'Identifier') {
        return;
      }

      const orig = path.value.property.name;

      if (orig === 'extractRequestData') {
        j(path).replaceWith(j.identifier('extractRequestData'));
        importsToAdd.add('extractRequestData');
      } else {
        // This means there is something else used from `Handlers`, so we can't remove the import
        shouldRemoveHandlersImport = false;
      }
    });

    // Find old types: Sentry.Handlers.ExpressRequest
    tree
      .find(j.TSTypeReference, {
        typeName: {
          type: 'TSQualifiedName',
          right: { type: 'Identifier', name: 'ExpressRequest' },
        },
      })
      .forEach(path => {
        if (path.value.typeName.type !== 'TSQualifiedName') {
          return;
        }

        const left = path.value.typeName.left;
        const right = path.value.typeName.right;

        if (right.type !== 'Identifier' || right.name !== 'ExpressRequest') {
          return;
        }

        if (left.type === 'Identifier' && left.name === 'Handlers') {
          // Handle `Handlers.ExpressRequest` --> `PolymorophicRequest`
          j(path).replaceWith(j.tsTypeReference(j.identifier('PolymorphicRequest')));
          importsToAdd.add('PolymorphicRequest');
          return;
        }

        if (
          left.type === 'TSQualifiedName' &&
          left.left.type === 'Identifier' &&
          left.left.name === 'Sentry' &&
          left.right.type === 'Identifier' &&
          left.right.name === 'Handlers'
        ) {
          // Handle `Sentry.Handlers.ExpressRequest` --> `Sentrt.PolymorophicRequest`
          j(path).replaceWith(j.tsQualifiedName(j.identifier('Sentry'), j.identifier('PolymorphicRequest')));
        }
      });

    // Replace import { Handlers } from '@sentry/node' with import { extractRequestData } from '@sentry/node'
    tree
      .find(j.ImportDeclaration, {
        source: { type: 'StringLiteral', value: '@sentry/node' },
        specifiers: [{ type: 'ImportSpecifier', imported: { name: 'Handlers' }, local: { name: 'Handlers' } }],
      })
      .forEach(path => {
        const specifiers = path.value.specifiers || [];
        const handlersSpecifier = specifiers.find(
          specifier => specifier.type === 'ImportSpecifier' && specifier.imported.name === 'Handlers'
        );

        // Remove `Handlers` import if we don't need it anymore
        if (handlersSpecifier && shouldRemoveHandlersImport) {
          specifiers.splice(specifiers.indexOf(handlersSpecifier), 1);
        }

        // Add new imports
        for (const importToAdd of importsToAdd) {
          specifiers.push(j.importSpecifier(j.identifier(importToAdd)));
        }
      });

    // Replace requires of { Handlers }
    tree
      .find(j.VariableDeclaration, {
        declarations: [
          {
            type: 'VariableDeclarator',
            init: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'require' },
              arguments: [{ value: '@sentry/node' }],
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

          const indexToDelete = shouldRemoveHandlersImport
            ? requireVars.properties.findIndex(property => {
                if (property.type !== 'ObjectProperty') {
                  return false;
                }

                // This is what is imported, e.g. const {x} = Sentry;
                if (property.key.type === 'Identifier' && property.key.name === 'Handlers') {
                  return true;
                }

                return false;
              })
            : -1;

          if (indexToDelete > -1) {
            requireVars.properties.splice(indexToDelete, 1);
          }

          // Add new requires
          for (const importToAdd of importsToAdd) {
            const prop = j.objectProperty(j.identifier(importToAdd), j.identifier(importToAdd));
            prop.shorthand = true;

            requireVars.properties.push(prop);
          }
        }
      });

    return tree.toSource();
  });
};
