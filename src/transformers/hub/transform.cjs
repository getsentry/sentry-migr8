const { adapt } = require('jscodeshift-adapters');

const { addTodoComment, modifyImports, dedupeImportStatements } = require('../../utils/jscodeshift.cjs');

/**
 * This transform converts usages of hub APIs to use global APIs instead.
 *
 * Messages for:
 * hub.bindClient()
 * hub.pushScope()
 * hub.popScope()
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
function hub(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;

  const hubMethodMap = new Map([
    ['withScope', 'withScope'],
    ['getClient', 'getClient'],
    ['getScope', 'getCurrentScope'],
    ['getIsolationScope', 'getIsolationScope'],
    ['captureException', 'captureException'],
    ['captureMessage', 'captureMessage'],
    ['captureEvent', 'captureEvent'],
    ['addBreadcrumb', 'addBreadcrumb'],
    ['setUser', 'setUser'],
    ['setTags', 'setTags'],
    ['setExtra', 'setExtra'],
    ['setContext', 'setContext'],
    ['getIntegration', 'getIntegration'],
    ['captureSession', 'captureSession'],
    ['startSession', 'startSession'],
    ['endSession', 'endSession'],
  ]);

  const tree = j(source);

  const methodsUsed = new Set();

  let hasChanges = false;

  // Replace getCurrentHub().xxx() and hub.xxx()
  tree.find(j.CallExpression, { callee: { type: 'MemberExpression' } }).forEach(path => {
    if (path.value.callee.type !== 'MemberExpression' || path.value.callee.property.type !== 'Identifier') {
      return;
    }

    const method = path.value.callee.property.name;
    const caller = path.value.callee.object;
    const mapTo = hubMethodMap.get(method);

    const callerIsHubVar = caller.type === 'Identifier' && caller.name.toLocaleLowerCase().includes('hub');
    const callerIsGetCurrentHub =
      caller.type === 'CallExpression' && caller.callee.type === 'Identifier' && caller.callee.name === 'getCurrentHub';
    if (callerIsHubVar || callerIsGetCurrentHub) {
      hasChanges = true;
      if (mapTo) {
        methodsUsed.add(mapTo);
        path.replace(j.callExpression(j.identifier(mapTo), path.value.arguments));
      } else {
        addTodoComment(
          j,
          path,
          'Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub'
        );
      }
    }
  });

  // Replace Sentry.getCurrentHub().xxx()
  tree
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: {
          type: 'CallExpression',
          callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'getCurrentHub' } },
        },
      },
    })
    .forEach(path => {
      if (
        path.value.callee.type !== 'MemberExpression' ||
        path.value.callee.property.type !== 'Identifier' ||
        path.value.callee.object.type !== 'CallExpression' ||
        path.value.callee.object.callee.type !== 'MemberExpression' ||
        path.value.callee.object.callee.object.type !== 'Identifier'
      ) {
        return;
      }

      const method = path.value.callee.property.name;
      const mapTo = hubMethodMap.get(method);

      const sentryVar = path.value.callee.object.callee.object;

      hasChanges = true;
      if (mapTo) {
        path.replace(j.callExpression(j.memberExpression(sentryVar, j.identifier(mapTo)), path.value.arguments));
      } else {
        addTodoComment(
          j,
          path,
          'Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub'
        );
      }
    });

  if (!hasChanges) {
    return undefined;
  }

  const sdk = options.sentry?.sdk;
  if (sdk) {
    modifyImports(j, tree, source, sdk, Array.from(methodsUsed), ['getCurrentHub']);
    dedupeImportStatements(sdk, tree, j);
  }

  return tree.toSource();
}

module.exports = adapt(hub);
