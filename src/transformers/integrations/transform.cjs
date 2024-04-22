const { hasSentryImportOrRequire, replaceImported, dedupeImportStatements } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

const INTEGRATIONS_PACKAGE = '@sentry/integrations';
const INTEGRATIONS_HASH_KEY = 'Integrations';

/** @type Record<string, string> */
const integrationMap = {
  // Browser
  BrowserTracing: 'browserTracingIntegration',
  Replay: 'replayIntegration',
  Feedback: 'feedbackIntegration',
  Breadcrumbs: 'breadcrumbsIntegration',
  TryCatch: 'browserApiErrorsIntegration',
  GlobalHandlers: 'globalHandlersIntegration',
  HttpContext: 'httpContextIntegration',
  // Core
  InboundFilters: 'inboundFiltersIntegration',
  FunctionToString: 'functionToStringIntegration',
  LinkedErrors: 'linkedErrorsIntegration',
  ModuleMetadata: 'moduleMetadataIntegration',
  RequestData: 'requestDataIntegration',
  // Integrations
  CaptureConsole: 'captureConsoleIntegration',
  Debug: 'debugIntegration',
  Dedupe: 'dedupeIntegration',
  ExtraErrorData: 'extraErrorDataIntegration',
  ReportingObserver: 'reportingObserverIntegration',
  RewriteFrames: 'rewriteFramesIntegration',
  SessionTiming: 'sessionTimingIntegration',
  ContextLines: 'contextLinesIntegration',
  HttpClient: 'httpClientIntegration',
  // Node
  Console: 'consoleIntegration',
  Http: 'httpIntegration',
  OnUncaughtException: 'onUncaughtExceptionIntegration',
  OnUnhandledRejection: 'onUnhandledRejectionIntegration',
  Modules: 'modulesIntegration',
  Context: 'nodeContextIntegration',
  LocalVariables: 'localVariablesIntegration',
  Undici: 'nodeFetchIntegration',
  Spotlight: 'spotlightIntegration',
  Anr: 'anrIntegration',
  Hapi: 'hapiIntegration',
};

const integrationFunctions = Object.values(integrationMap);

/**
 * This transform converts usages of e.g. `new BrowserTracing()` to `browserTracingIntegration()`.
 *
 * This replaces the integration classes in the following scenarios:
 * - `new BrowserTracing()`
 * - `new Sentry.BrowserTracing()`
 * - `new Integrations.BrowserTracing()`
 * - `new Sentry.Integrations.BrowserTracing()`
 *
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

    const sdk = options.sentry?.sdk;

    // Replace `new Sentry.Integrations.xxx` with `Sentry.xxx`
    tree
      .find(j.NewExpression, {
        callee: {
          type: 'MemberExpression',
          object: { type: 'MemberExpression', object: { type: 'Identifier' }, property: { type: 'Identifier' } },
          property: { type: 'Identifier' },
        },
      })
      .forEach(path => {
        if (
          path.value.callee.type !== 'MemberExpression' ||
          path.value.callee.object.type !== 'MemberExpression' ||
          path.value.callee.object.object.type !== 'Identifier' ||
          path.value.callee.object.property.type !== 'Identifier' ||
          path.value.callee.property.type !== 'Identifier'
        ) {
          return;
        }

        const objName = path.value.callee.object.object.name;
        const maybeIntegrations = path.value.callee.object.property.name;
        const className = path.value.callee.property.name;
        const args = path.value.arguments;
        const fnName = integrationMap[className];

        if (maybeIntegrations !== INTEGRATIONS_HASH_KEY) {
          return;
        }

        if (fnName) {
          path.replace(j.callExpression(j.memberExpression(j.identifier(objName), j.identifier(fnName)), args));
          return;
        }
      });

    // Replace `new BrowserTracing()`
    tree.find(j.NewExpression, { callee: { type: 'Identifier' } }).forEach(path => {
      if (path.value.callee.type !== 'Identifier') {
        return;
      }

      const className = path.value.callee.name;
      const args = path.value.arguments;
      const fnName = integrationMap[className];

      if (fnName) {
        path.replace(j.callExpression(j.identifier(fnName), args));
        return;
      }
    });

    // Replace `new Sentry.BrowserTracing()`
    tree
      .find(j.NewExpression, {
        callee: { type: 'MemberExpression', object: { type: 'Identifier' }, property: { type: 'Identifier' } },
      })
      .forEach(path => {
        if (
          path.value.callee.type !== 'MemberExpression' ||
          path.value.callee.object.type !== 'Identifier' ||
          path.value.callee.property.type !== 'Identifier'
        ) {
          return;
        }

        const objName = path.value.callee.object.name;
        const className = path.value.callee.property.name;
        const args = path.value.arguments;
        const fnName = integrationMap[className];

        if (fnName) {
          path.replace(j.callExpression(j.memberExpression(j.identifier(objName), j.identifier(fnName)), args));
          return;
        }
      });

    if (sdk) {
      // Replace imports of classes with functions
      replaceImported(j, tree, source, sdk, new Map(Object.entries(integrationMap)));
      replaceImported(j, tree, source, INTEGRATIONS_PACKAGE, new Map(Object.entries(integrationMap)));

      // Replace `Integrations.browserTracingIntegration()`
      // First we check that we actually have a `Integrations` import from our package
      let integrationsVarName = undefined;
      const integrationsUsed = new Set();

      const integrationsImport = tree
        .find(j.ImportDeclaration, {
          source: { type: 'StringLiteral', value: sdk },
        })
        .filter(path => {
          const specifiers = path.value.specifiers || [];

          return specifiers.some(
            specifier =>
              specifier.type === 'ImportSpecifier' &&
              specifier.local?.type === 'Identifier' &&
              specifier.imported?.name === INTEGRATIONS_HASH_KEY
          );
        });

      integrationsImport.forEach(path => {
        // We cache the used import name so we can use it later
        const specifiers = path.value.specifiers || [];

        const name = specifiers.find(
          specifier =>
            specifier.type === 'ImportSpecifier' &&
            specifier.local?.type === 'Identifier' &&
            specifier.imported?.name === INTEGRATIONS_HASH_KEY
        )?.local?.name;

        if (name) {
          integrationsVarName = name;
        }
      });

      const integrationsRequire = tree.find(j.VariableDeclaration).filter(path => {
        return path.value.declarations.some(declaration => {
          return (
            declaration.type === 'VariableDeclarator' &&
            declaration.init?.type === 'CallExpression' &&
            declaration.init.callee.type === 'Identifier' &&
            declaration.init.callee.name === 'require' &&
            declaration.init.arguments.length === 1 &&
            declaration.init.arguments[0].type === 'StringLiteral' &&
            declaration.init.arguments[0].value === sdk
          );
        });
      });

      integrationsRequire.forEach(path => {
        path.value.declarations.forEach(declaration => {
          if (declaration.type === 'VariableDeclarator' && declaration.id.type === 'ObjectPattern') {
            const properties = declaration.id.properties || [];

            properties.forEach(property => {
              if (
                property.type === 'ObjectProperty' &&
                property.key.type === 'Identifier' &&
                property.key.name === INTEGRATIONS_HASH_KEY &&
                property.value.type === 'Identifier'
              ) {
                const name = property.value.name;
                if (name) {
                  integrationsVarName = name;
                }
              }
            });
          }
        });
      });

      // This replaces usages of `Integrations.xxx()` with `xxx()`
      if (integrationsVarName) {
        tree
          .find(j.CallExpression, {
            callee: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: integrationsVarName },
              property: { type: 'Identifier' },
            },
          })
          .forEach(path => {
            if (
              path.value.callee.type !== 'MemberExpression' ||
              path.value.callee.object.type !== 'Identifier' ||
              path.value.callee.property.type !== 'Identifier'
            ) {
              return;
            }

            const fnName = path.value.callee.property.name;

            // Only handle known integration functions
            if (!integrationFunctions.includes(fnName)) {
              return;
            }

            integrationsUsed.add(fnName);

            path.replace(j.callExpression(j.identifier(fnName), path.value.arguments));
          });
      }

      // Fix imports of `Integrations`
      integrationsImport.forEach(path => {
        let specifiers = path.value.specifiers || [];

        // Remove the `Integrations` import itself
        specifiers = specifiers.filter(
          specifier => specifier.type === 'ImportSpecifier' && specifier.imported?.name !== INTEGRATIONS_HASH_KEY
        );

        // Add the new imports (if they don't yet exist)
        integrationsUsed.forEach(fnName => {
          if (!specifiers.some(specifier => specifier.type === 'ImportSpecifier' && specifier.local?.name === fnName)) {
            specifiers.push(j.importSpecifier(j.identifier(fnName)));
          }
        });

        // Update import statement
        path.value.specifiers = specifiers;
      });

      dedupeImportStatements(sdk, tree, j);

      // Fix requires of `Integrations`
      integrationsRequire.forEach(path => {
        path.value.declarations.forEach(declaration => {
          if (declaration.type === 'VariableDeclarator' && declaration.id.type === 'ObjectPattern') {
            let properties = declaration.id.properties || [];

            // Remove the `Integrations` require itself
            properties = properties.filter(
              prop =>
                prop.type === 'ObjectProperty' &&
                prop.key.type === 'Identifier' &&
                prop.key.name !== INTEGRATIONS_HASH_KEY
            );

            // Add the new requires (if they don't yet exist)
            integrationsUsed.forEach(fnName => {
              if (
                !properties.some(
                  prop => prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.key.name === fnName
                )
              ) {
                const prop = j.objectProperty(j.identifier(fnName), j.identifier(fnName));
                prop.shorthand = true;
                properties.push(prop);
              }
            });

            // Update require statement
            declaration.id.properties = properties;
          }
        });
      });
    }

    return tree.toSource();
  });
};
