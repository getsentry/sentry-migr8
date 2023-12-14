const { hasSentryImportOrRequire, replaceImported } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

/**
 * This transform converts usages of `configureScope((scope) => {})` to use `getCurrentScope()` instead.
 *
 * Replaces:
 *
 * ```
 * configureScope((scope) => {
 *   scope.setTag('foo', 'bar');
 *   scope.addEventProcessor(fn);
 * });
 * ```
 *
 * with
 *
 * ```
 * const scope = getCurrentScope();
 * scope.setTag('foo', 'bar');
 * scope.addEventProcessor(fn);
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

    // If no sentry import, skip it
    if (!hasSentryImportOrRequire(source)) {
      return undefined;
    }

    if (!source.includes('configureScope')) {
      return undefined;
    }

    // Replace `configureScope()`
    tree.find(j.CallExpression).forEach(path => {
      if (path.value.callee.type !== 'Identifier' || path.value.callee.name !== 'configureScope') {
        return;
      }

      const callbackFn = path.value.arguments[0];
      if (callbackFn.type !== 'ArrowFunctionExpression' && callbackFn.type !== 'FunctionExpression') {
        return;
      }

      // The var name of the scope callback, e.g. (scope) => {} would be "scope"
      const scopeVarName = callbackFn.params[0]?.type === 'Identifier' ? callbackFn.params[0].name : undefined;

      if (!scopeVarName) {
        return;
      }

      const callbackBody = callbackFn.body;

      if (callbackBody.type !== 'BlockStatement') {
        return;
      }

      path.replace(
        j.blockStatement([
          j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(scopeVarName), j.callExpression(j.identifier('getCurrentScope'), [])),
          ]),
          ...callbackBody.body,
        ])
      );
    });

    // Replace e.g. `SentryUtuils.configureScope()`
    tree.find(j.CallExpression).forEach(path => {
      if (
        path.value.callee.type !== 'MemberExpression' ||
        path.value.callee.property.type !== 'Identifier' ||
        path.value.callee.property.name !== 'configureScope'
      ) {
        return;
      }

      const calleeObj = path.value.callee.object;

      const callbackFn = path.value.arguments[0];
      if (callbackFn.type !== 'ArrowFunctionExpression' && callbackFn.type !== 'FunctionExpression') {
        return;
      }

      // The var name of the scope callback, e.g. (scope) => {} would be "scope"
      const scopeVarName = callbackFn.params[0]?.type === 'Identifier' ? callbackFn.params[0].name : undefined;

      if (!scopeVarName) {
        return;
      }

      const callbackBody = callbackFn.body;

      if (callbackBody.type !== 'BlockStatement') {
        return;
      }

      path.replace(
        j.blockStatement([
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier(scopeVarName),
              j.memberExpression(calleeObj, j.callExpression(j.identifier('getCurrentScope'), []))
            ),
          ]),
          ...callbackBody.body,
        ])
      );
    });

    const sdk = options.sentry?.sdk;
    if (sdk) {
      replaceImported(j, tree, source, sdk, new Map([['configureScope', 'getCurrentScope']]));
    }

    return tree.toSource();
  });
};
