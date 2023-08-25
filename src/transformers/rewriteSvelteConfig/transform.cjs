const { hasSentryImportOrRequire } = require('../../utils/jscodeshift.cjs');

/**
 * This transformer rewrites the `svelte.config.js` file to use the `withSentryConfig` function
 *
 * Replaces the `componentTrackingPreprocessor` function call with wrapping `withSentryConfig` around the
 * default exprt of the config file.
 *
 * @param {import('jscodeshift').FileInfo} fileInfo
 * @param {import('jscodeshift').API} api
 * @param {import('jscodeshift').Options & { sentry: import('types').RunOptions & {sdk: string} }} options
 */
module.exports = function transform(fileInfo, api, options) {
  const j = api.jscodeshift;
  const source = fileInfo.source;

  // We're already filtering beforehand for @sentry/svelte or @sentry/sveltekit
  // so `options.sentry.sdk` is guaranteed to be one of those two
  if (!hasSentryImportOrRequire(fileInfo.source, options.sentry.sdk)) {
    return undefined;
  }

  const root = j(source, options);

  const sentryNamespaceImports = root
    .find(j.ImportDeclaration, { source: { value: options.sentry.sdk } })
    .filter(
      importPath => !!importPath.node.specifiers?.some(specifier => specifier.type === 'ImportNamespaceSpecifier')
    );

  /** { @type import('jscodeshift').ASTPath<import('jscodeshift').ImportDeclaration> | undefined */
  const sentryNamespaceImport = sentryNamespaceImports.length ? sentryNamespaceImports.get() : undefined;
  const sentryNameSpace = sentryNamespaceImport?.node.specifiers?.[0].local?.name;

  // 1. remove `sentryComponentTrackingPreprocessor()`

  if (sentryNameSpace) {
    const preprocCalls = root.find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: sentryNameSpace },
        property: { type: 'Identifier', name: 'componentTrackingPreprocessor' },
      },
    });
    preprocCalls.remove();
  } else {
    const preprocCalls = root.find(j.CallExpression, { callee: { name: 'componentTrackingPreprocessor' } });
    preprocCalls.remove();
  }

  // 2. wrap withSentryConfig around the default export

  /** { @type import('jscodeshift').ASTPath<import('jscodeshift').ExportDefaultDeclaration> */
  const defaultExport = root.find(j.ExportDefaultDeclaration).get(0);

  const oldDefaultExportValue = defaultExport.node.declaration;

  // if the old declaration value already has withSentryConfig, we are done
  if (j(oldDefaultExportValue).toSource().includes('withSentryConfig(')) {
    return root.toSource();
  }

  if (sentryNameSpace) {
    const newDefaultExportDeclaration = j.callExpression(
      j.memberExpression(j.identifier(sentryNameSpace), j.identifier('withSentryConfig')),
      // @ts-ignore there's probably a few edge cases which is why TS is complaining. I'm lazy :)
      [oldDefaultExportValue]
    );
    defaultExport.node.declaration = newDefaultExportDeclaration;
  } else {
    // @ts-ignore there's probably a few edge cases which is why TS is complaining. I'm lazy :)
    const newDefaultExportDeclaration = j.callExpression(j.identifier('withSentryConfig'), [oldDefaultExportValue]);
    defaultExport.node.declaration = newDefaultExportDeclaration;

    root
      .find(j.ImportDeclaration, { source: { value: options.sentry.sdk } })
      .insertAfter(
        j.importDeclaration([j.importSpecifier(j.identifier('withSentryConfig'))], j.literal(options.sentry.sdk))
      );

    root.find(j.ImportDeclaration, { source: { value: options.sentry.sdk } }).forEach(importPath => {
      importPath.node.specifiers = importPath.node.specifiers?.filter(
        specifier => specifier.type !== 'ImportSpecifier' || specifier.imported.name !== 'componentTrackingPreprocessor'
      );

      if (!importPath.node.specifiers?.length) {
        importPath.prune();
      }
    });
  }
  return root.toSource();
};
