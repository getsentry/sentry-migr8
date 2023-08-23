const { getSentryInitExpression } = require('../../utils/jscodeshift.cjs');

/**
 * This transform converts old tracing options to their new format.
 * Specifically, it handles these:
 *
 * `tracePropagationTargets` from integration config to root level config
 *
 * TODO: `tracingOrigins` has to be rewritten
 *
 * @type {import('jscodeshift').Transform}
 */
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;

  const source = fileInfo.source;
  const tree = j(source);

  // First we look for `tracePropagationTargets` as integration config, moving it to root

  const sentryInit = getSentryInitExpression(j, tree, source);

  // Nothing to do if we can't find the init expression
  if (!sentryInit) {
    return;
  }

  // Find & update options on `new BrowserTracing()`
  const newBrowserTracing = getIntegrationNewExpression(j, tree, 'BrowserTracing');
  const newHttp = getIntegrationNewExpression(j, tree, 'Http');
  const newUndici = getIntegrationNewExpression(j, tree, 'Undici');

  if (newBrowserTracing) {
    fixTracePropagationTargets(j, sentryInit, newBrowserTracing);
  }
  if (newHttp) {
    fixTracePropagationTargets(j, sentryInit, newHttp);
  }
  if (newUndici) {
    fixTracePropagationTargets(j, sentryInit, newUndici);
  }

  return tree.toSource();
};

/**
 *
 * @param {import('jscodeshift')} j
 * @param {import('jscodeshift').Collection} tree
 * @param {string} integrationName
 * @returns {undefined | import('jscodeshift').Collection<import('jscodeshift').NewExpression>}
 */
function getIntegrationNewExpression(j, tree, integrationName) {
  // First try to find new XX.IntegrationName()
  const a = tree.find(j.NewExpression, { callee: { property: { name: integrationName } } });

  if (a.size() > 0) {
    return a;
  }

  // Else try new IntegrationName()
  const b = tree.find(j.NewExpression, { callee: { name: integrationName } });
  if (b.size() > 0) {
    return b;
  }

  return undefined;
}

/**
 *
 * @param {import('jscodeshift')} j
 * @param {import('jscodeshift').Collection<import('jscodeshift').CallExpression>} sentryInit
 * @param {import('jscodeshift').Collection<import('jscodeshift').NewExpression>} newExpression
 * @returns {void}
 */
function fixTracePropagationTargets(j, sentryInit, newExpression) {
  // Check if we have a `tracePropagationTargets` or `traceOrigins` property in the integration settings
  newExpression
    .find(j.ObjectProperty, {
      key: { type: 'Identifier' },
    })
    .forEach(prop => {
      if (
        prop.value.key.type !== 'Identifier' ||
        (prop.value.key.name !== 'tracePropagationTargets' && prop.value.key.name !== 'tracingOrigins')
      ) {
        return;
      }

      sentryInit.forEach(path => {
        const arg = path.value.arguments[0];

        if (
          arg.type !== 'ObjectExpression' ||
          // Already has targets, skip...
          arg.properties.some(
            prop =>
              prop.type === 'ObjectProperty' &&
              prop.key.type === 'Identifier' &&
              prop.key.name === 'tracePropagationTargets'
          )
        ) {
          return;
        }

        arg.properties.push(j.objectProperty(j.identifier('tracePropagationTargets'), prop.value.value));
        j(prop).remove();
      });
    });
}
