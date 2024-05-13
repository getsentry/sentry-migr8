const path = require('node:path');
const fs = require('node:fs');

const { wrapJscodeshift } = require('../../utils/dom.cjs');
const { hasSentryImportOrRequire, getSentryInitExpression } = require('../../utils/jscodeshift.cjs');

/**
 * Moves Sentry config for `@sentry/node` into a dedicated instrument.js file.
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    const sdk = options.sentry?.sdk;

    // This transform only applies to `@sentry/node` - for others, we do not want to do anything
    if (sdk !== '@sentry/node' || !hasSentryImportOrRequire(source, sdk)) {
      return undefined;
    }

    // If the file is already an instrument.js or similar file, we skip
    // This is a simple heuristic, but implies that probably the Sentry code is already split out.
    if (/(instrument)|(tracing)|(sentry)|(trace)(\w|)*\.(\w+)$/i.test(fileName)) {
      return undefined;
    }

    const sentryInit = getSentryInitExpression(j, tree, source);

    if (!sentryInit) {
      return;
    }

    const sentryInitNode = sentryInit.paths()[0];

    if (!sentryInitNode) {
      return;
    }

    const folder = path.dirname(fileName);
    const extension = path.extname(fileName);

    // Create new file
    const instrumentFileName = `instrument${extension}`;
    const instrumentFilePath = path.join(folder, instrumentFileName);

    // If file already exists, we skip
    if (fs.existsSync(instrumentFilePath)) {
      return undefined;
    }

    const sentryImport = tree.find(j.ImportDeclaration, { source: { type: 'StringLiteral', value: sdk } });

    const instrumentFile = j(j(j.expressionStatement(sentryInitNode.value)).toSource());

    // Add all imports to the top of the instrument file - we later remove unused imports again
    tree
      .find(j.ImportDeclaration)
      .paths()
      .reverse()
      .forEach(path => {
        instrumentFile.get().node.program.body.unshift(j(path).toSource());
      });

    // Add all requires to the top of the instrument file - we later remove unused requires again
    tree
      .find(j.VariableDeclaration, {
        declarations: [
          {
            type: 'VariableDeclarator',
            init: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'require' },
            },
          },
        ],
      })
      .paths()
      .reverse()
      .forEach(path => {
        instrumentFile.get().node.program.body.unshift(j(path).toSource());
      });

    const instrumentFile2 = j(instrumentFile.toSource());
    removeUnusedImports(j, instrumentFile2);
    removeUnusedRequires(j, instrumentFile2);

    fs.writeFileSync(instrumentFilePath, instrumentFile2.toSource());

    // Add import as first thing
    // Note: We import/require without file extension, this is the most common way
    // Potential improvement:
    // We could check if the file has any relative imports / require and see if that uses file extension
    if (sentryImport.length > 0) {
      tree.get().node.program.body.unshift(j.importDeclaration([], j.literal('./instrument')));
    } else {
      // Else we add a require
      const requireStatement = j.callExpression(j.identifier('require'), [j.literal('./instrument')]);
      tree.get().node.program.body.unshift(j.expressionStatement(requireStatement));
    }

    // Remove from original file
    j(sentryInitNode).remove();

    removeUnusedImports(j, tree);
    removeUnusedRequires(j, tree);

    return tree.toSource();
  });
};

/**
 * Remove any unused imports from the file.
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} tree
 */
function removeUnusedImports(j, tree) {
  tree.find(j.ImportDeclaration).forEach(path => {
    const specifiers = path.value.specifiers || [];

    // no specifiers = side-effect import
    if (specifiers.length === 0) {
      return;
    }

    const filtered = specifiers.filter(specifier => {
      const name = specifier.local?.name;
      const type = specifier.type;

      if (!name) {
        return true;
      }

      return identifierIsUsed(j, tree, name, type);
    });

    if (filtered.length) {
      path.value.specifiers = filtered;
    } else {
      j(path).remove();
    }
  });
}

/**
 * Remove any unused requires from the file.
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} tree
 */
function removeUnusedRequires(j, tree) {
  tree
    .find(j.VariableDeclaration, {
      declarations: [
        {
          type: 'VariableDeclarator',
          init: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'require' },
          },
        },
      ],
    })
    .forEach(path => {
      const declarations = path.value.declarations;

      // no declarations = side-effect import
      if (declarations.length === 0) {
        return;
      }

      const filtered = declarations.filter(declaration => {
        const declarationType = declaration.type;
        if (declarationType !== 'VariableDeclarator') {
          return true;
        }

        // default/namespace export
        const type = declaration.id.type;
        if (type === 'Identifier') {
          const name = declaration.id.name;
          return identifierIsUsed(j, tree, name, declarationType);
        }

        // destructured import
        if (type === 'ObjectPattern') {
          const properties = declaration.id.properties || [];
          const filteredProperties = properties.filter(property => {
            if (property.type !== 'ObjectProperty' || property.value.type !== 'Identifier') {
              return true;
            }

            const name = property.value.name;
            return identifierIsUsed(j, tree, name, property.type);
          });

          if (filteredProperties.length) {
            declaration.id.properties = filteredProperties;
            return true;
          } else {
            return false;
          }
        }

        return true;
      });

      if (filtered.length) {
        path.value.declarations = filtered;
      } else {
        j(path).remove();
      }
    });
}

/**
 * Checks if a given identifier is used in the file.
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection} tree
 * @param {string} name
 * @param {string} parentType
 * @returns {boolean}
 */
function identifierIsUsed(j, tree, name, parentType) {
  const usages = tree.find(j.Identifier, { name }).filter(identifier => {
    const pType = identifier.parentPath.value.type;
    // Ignore imports themselves
    return pType !== parentType;
  });

  return usages.length > 0;
}
