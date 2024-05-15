const Sentry = require('@sentry/node');

const { wrapJscodeshift } = require('../../utils/dom.cjs');
const { addTodoComment } = require('../../utils/jscodeshift.cjs');

/**
 * Adds comments for migrations that migr8 can't do automatically.
 * This helps the user to identify places where they need to do manual work.
 *
 * @type {import('jscodeshift').Transform}
 */
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;
  const fileName = fileInfo.path;

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    let hasChanges = false;

    const methodCommentMap = new Map([
      [
        'startTransaction',
        'Use `startInactiveSpan()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md',
      ],
      [
        'startChild',
        'Use `startInactiveSpan()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md',
      ],
      [
        'makeMain',
        'Use `setCurrentClient()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md',
      ],
      [
        'getActiveTransaction',
        'Use `getActiveSpan()` instead. If you use this only to start a child, use `startInactiveSpan({ onlyIfParent: true })` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md',
      ],
    ]);

    // Find `xxx()` calls
    tree
      .find(j.CallExpression, {
        callee: {
          type: 'Identifier',
        },
      })
      .forEach(path => {
        if (path.value.callee.type === 'Identifier') {
          const comment = methodCommentMap.get(path.value.callee.name);
          if (comment) {
            hasChanges = true;
            addTodoComment(j, path, comment);
          }
        }
      });

    // Find `Sentry.xxx()`  calls
    tree
      .find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          property: {
            type: 'Identifier',
          },
        },
      })
      .forEach(path => {
        if (path.value.callee.type === 'MemberExpression' && path.value.callee.property.type === 'Identifier') {
          const comment = methodCommentMap.get(path.value.callee.property.name);
          if (comment) {
            hasChanges = true;
            addTodoComment(j, path, comment);
          }
        }
      });

    // Find `new Hub()` & `new Sentry.Hub()`
    tree.find(j.NewExpression).forEach(path => {
      if (
        (path.value.callee.type === 'Identifier' && path.value.callee.name === 'Hub') ||
        (path.value.callee.type === 'MemberExpression' &&
          path.value.callee.property.type === 'Identifier' &&
          path.value.callee.property.name === 'Hub')
      ) {
        hasChanges = true;
        addTodoComment(
          j,
          path,
          'Use `new Scope()` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md'
        );
      }
    });

    if (hasChanges) {
      Sentry.setTag('added-todo-comments', true);
      Sentry.metrics.increment('added-todo-comments', 1);
    }

    return hasChanges ? tree.toSource() : undefined;
  });
};
