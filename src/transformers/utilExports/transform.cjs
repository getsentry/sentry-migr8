const { replaceFunctionCalls, replaceImported } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

const FunctionMap = new Map([['severityFromString', 'severityLevelFromString']]);

/**
 * This transform converts old util methods to their new format.
 *
 * Transforms:
 * `severityFromString` → `severityLevelFromString`
 * `getGlobalObject` → `GLOBAL_OBJ`
 * `timestampWithMs` → `timestampInSeconds`
 *
 * @type {import('jscodeshift').Transform}
 */
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    // Replace function calls
    const hasChangedFunctionCalls = replaceFunctionCalls(j, tree, source, '@sentry/utils', FunctionMap);

    /** @type {Map<string, string>} */
    const importsToReplace = new Map();

    // Replace getGlobalObject() with GLOBAL_OBJ
    tree.find(j.CallExpression).forEach(path => {
      if (path.value.callee.type !== 'Identifier') {
        return;
      }

      const orig = path.value.callee.name;

      if (orig === 'getGlobalObject') {
        path.replace(j.identifier('GLOBAL_OBJ'));
        importsToReplace.set('getGlobalObject', 'GLOBAL_OBJ');
        return;
      }
    });

    // Replace `SentryUtils.getGlobalObject()` with `SentryUtils.GLOBAL_OBJ`
    tree.find(j.CallExpression, { callee: { type: 'MemberExpression' } }).forEach(path => {
      if (path.value.callee.type !== 'MemberExpression' || path.value.callee.property.type !== 'Identifier') {
        return;
      }

      const orig = path.value.callee.property.name;

      if (orig === 'getGlobalObject') {
        path.replace(j.identifier('GLOBAL_OBJ'));
        importsToReplace.set('getGlobalObject', 'GLOBAL_OBJ');
      }
    });

    // Replace timestampWithMs with timestampInSeconds
    tree.find(j.Identifier, { name: 'timestampWithMs' }).forEach(path => {
      const orig = path.value.name;

      if (orig === 'timestampWithMs') {
        path.replace(j.identifier('timestampInSeconds'));
        importsToReplace.set('timestampWithMs', 'timestampInSeconds');
        return;
      }
    });

    if (importsToReplace.size > 0) {
      replaceImported(j, tree, source, '@sentry/utils', importsToReplace);
    }

    if (!hasChangedFunctionCalls && importsToReplace.size === 0) {
      return;
    }

    return tree.toSource();
  });
};
