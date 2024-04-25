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
      if (!callbackFn || (callbackFn.type !== 'ArrowFunctionExpression' && callbackFn.type !== 'FunctionExpression')) {
        return;
      }

      // The var name of the scope callback, e.g. (scope) => {} would be "scope"
      const scopeVarName = callbackFn.params[0]?.type === 'Identifier' ? callbackFn.params[0].name : undefined;

      if (!scopeVarName) {
        return;
      }

      const callbackBody = callbackFn.body;
      const getScopeMethodName = 'getCurrentScope';

      // If we only have a single statement inside, we can avoid the block
      // This handles both directly having a call expression: configureScope(scope => scope.setTag('foo', 'bar'))
      // As well as having a block with only a single call expression inside: configureScope(scope => { scope.setTag('foo', 'bar'); })
      const singleExpression = getExpression(callbackBody, scopeVarName);

      if (singleExpression && singleExpression.callee.type === 'MemberExpression') {
        path.replace(
          j.callExpression(
            j.memberExpression(
              j.callExpression(j.identifier(getScopeMethodName), []),
              singleExpression.callee.property
            ),
            singleExpression.arguments
          )
        );
        return;
      }

      if (callbackBody.type !== 'BlockStatement') {
        return;
      }

      path.replace(
        j.blockStatement([
          j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(scopeVarName), j.callExpression(j.identifier(getScopeMethodName), [])),
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
      if (!callbackFn || (callbackFn.type !== 'ArrowFunctionExpression' && callbackFn.type !== 'FunctionExpression')) {
        return;
      }

      // The var name of the scope callback, e.g. (scope) => {} would be "scope"
      const scopeVarName = callbackFn.params[0]?.type === 'Identifier' ? callbackFn.params[0].name : undefined;

      if (!scopeVarName) {
        return;
      }

      const callbackBody = callbackFn.body;

      // Very hacky, but we check if the callee (e.g. hub.configureScope() or getCurrentHub().configureScope())
      // contains "hub", and if so, we use `getScope()` instead of `getCurrentScope()`
      let getScopeMethodName = /hub/i.test(j(calleeObj).toSource()) ? 'getScope' : 'getCurrentScope';

      // If we only have a single statement inside, we can avoid the block
      // This handles both directly having a call expression: configureScope(scope => scope.setTag('foo', 'bar'))
      // As well as having a block with only a single call expression inside: configureScope(scope => { scope.setTag('foo', 'bar'); })
      const singleExpression = getExpression(callbackBody, scopeVarName);

      if (singleExpression && singleExpression.callee.type === 'MemberExpression') {
        path.replace(
          j.callExpression(
            j.memberExpression(
              j.memberExpression(calleeObj, j.callExpression(j.identifier(getScopeMethodName), [])),
              singleExpression.callee.property
            ),
            singleExpression.arguments
          )
        );
        return;
      }

      if (callbackBody.type !== 'BlockStatement') {
        return;
      }

      path.replace(
        j.blockStatement([
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier(scopeVarName),
              j.memberExpression(calleeObj, j.callExpression(j.identifier(getScopeMethodName), []))
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

/**
 * This methods detects if the body of a function is only a single expression, and if so returns that.
 * It handles both:
 *
 * ```
 * configureScope(scope => scope.setTag());
 * configureScope((scope) => {
 *  scope.setTag();
 * });
 * ```
 *
 * Returns the single expression, if there is only one.
 *
 * @param {import('jscodeshift').FunctionExpression['body'] | import('jscodeshift').ArrowFunctionExpression['body']} callbackBody
 * @param {string} scopeVarName
 * @returns {import('jscodeshift').CallExpression | undefined}
 */
function getExpression(callbackBody, scopeVarName) {
  // If we only have a single statement inside, we can avoid the block
  // This handles both directly having a call expression: configureScope(scope => scope.setTag('foo', 'bar'))
  // As well as having a block with only a single call expression inside: configureScope(scope => { scope.setTag('foo', 'bar'); })
  if (
    callbackBody.type === 'CallExpression' ||
    (callbackBody.type === 'BlockStatement' &&
      callbackBody.body.length === 1 &&
      callbackBody.body[0]?.type === 'ExpressionStatement')
  ) {
    const expression =
      callbackBody.type === 'CallExpression'
        ? callbackBody
        : callbackBody.body[0]?.type === 'ExpressionStatement' &&
          callbackBody.body[0].expression.type === 'CallExpression'
        ? callbackBody.body[0].expression
        : undefined;
    // We check that we have a single statement that is e.g. scope.xxxx() only
    if (
      expression &&
      expression.callee.type === 'MemberExpression' &&
      expression.callee.object.type === 'Identifier' &&
      expression.callee.object.name === scopeVarName
    ) {
      return expression;
    }
  }

  return undefined;
}
