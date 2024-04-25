const { hasSentryImportOrRequire } = require('../../utils/jscodeshift.cjs');
const { wrapJscodeshift } = require('../../utils/dom.cjs');

const SpanStatusMap = new Map([
  ['Ok', 'ok'],
  ['DeadlineExceeded', 'deadline_exceeded'],
  ['Unauthenticated', 'unauthenticated'],
  ['PermissionDenied', 'permission_denied'],
  ['NotFound', 'not_found'],
  ['ResourceExhausted', 'resource_exhausted'],
  ['InvalidArgument', 'invalid_argument'],
  ['Unimplemented', 'unimplemented'],
  ['Unavailable', 'unavailable'],
  ['InternalError', 'internal_error'],
  ['UnknownError', 'unknown_error'],
  ['Cancelled', 'cancelled'],
  ['AlreadyExists', 'already_exists'],
  ['FailedPrecondition', 'failed_precondition'],
  ['Aborted', 'aborted'],
  ['OutOfRange', 'out_of_range'],
  ['DataLoss', 'data_loss'],
]);

const SeverityMap = new Map([
  ['Fatal', 'fatal'],
  ['Error', 'error'],
  ['Warning', 'warning'],
  ['Log', 'log'],
  ['Info', 'info'],
  ['Debug', 'debug'],
]);

const enumMap = new Map([
  ['Severity', SeverityMap],
  ['SpanStatus', SpanStatusMap],
]);

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

  // Bail out if file has no sentry import - nothing to do then!
  if (!hasSentryImportOrRequire(source)) {
    return undefined;
  }

  return wrapJscodeshift(j, source, fileName, (j, source) => {
    const tree = j(source);

    /** @type {Record<string,string>} */
    const remove = {
      Severity: 'unused',
      SpanStatus: 'unused',
    };

    tree.find(j.MemberExpression, { property: { type: 'Identifier' } }).forEach(path => {
      if (path.value.property.type !== 'Identifier') {
        return;
      }

      let enumKey = undefined;

      if (path.value.object.type === 'Identifier') {
        enumKey = path.value.object.name;
      } else if (
        path.value.object.type === 'MemberExpression' &&
        path.value.object.object.type === 'Identifier' &&
        path.value.object.object.name === 'Sentry' &&
        path.value.object.property.type === 'Identifier'
      ) {
        enumKey = path.value.object.property.name;
      }

      if (!enumKey) {
        return;
      }

      const map = enumMap.get(enumKey);

      if (!map) {
        return;
      }

      const value = path.value.property.name;
      const newValue = map.get(value);

      if (newValue) {
        path.replace(j.stringLiteral(newValue));
        if (remove[enumKey] !== 'no') {
          remove[enumKey] = 'yes';
        }
      } else {
        // Unknown value, do not remove it
        remove[enumKey] = 'no';
      }
    });

    const toRemove = Object.keys(remove).filter(key => remove[key] === 'yes');

    if (toRemove.length > 0) {
      removeImportedIdentifiers(j, tree, toRemove);
    }

    return tree.toSource();
  });
};

/**
 * Deduplicate imported identifiers.
 * E.g. `import { aa, aa, bb } from '@sentry/react';`
 * --> `import { aa, bb } from '@sentry/react';`
 *
 * @param {import('jscodeshift').JSCodeshift} j
 * @param {import('jscodeshift').Collection<any>} tree
 * @param {string[]} identifiers
 */
function removeImportedIdentifiers(j, tree, identifiers) {
  // First find imports
  tree
    .find(j.ImportDeclaration, { source: { type: 'StringLiteral' } })
    .filter(path => path.value.source.type === 'StringLiteral' && path.value.source.value.startsWith('@sentry/'))
    .forEach(path => {
      const specifiers = path.value.specifiers || [];
      let pos = 0;
      while (pos < specifiers.length) {
        const specifier = specifiers[pos];
        if (!specifier || specifier.type !== 'ImportSpecifier' || !specifier.local) {
          return;
        }

        const name = specifier.local.name;
        if (identifiers.includes(name)) {
          specifiers.splice(pos, 1);
        }

        pos++;
      }

      if (specifiers.length > 0) {
        path.value.specifiers = specifiers;
      } else {
        j(path).remove();
      }
    });

  // Then find requires
  tree
    .find(j.VariableDeclaration)
    .filter(
      path =>
        path.value.declarations[0]?.type === 'VariableDeclarator' &&
        path.value.declarations[0].init?.type === 'CallExpression' &&
        path.value.declarations[0].init?.callee.type === 'Identifier' &&
        path.value.declarations[0].init?.callee.name === 'require' &&
        path.value.declarations[0].init?.arguments.some(
          arg => arg.type === 'StringLiteral' && arg.value.startsWith('@sentry/')
        )
    )
    .forEach(path => {
      if (
        path.value.declarations[0]?.type === 'VariableDeclarator' &&
        path.value.declarations[0].id.type === 'ObjectPattern'
      ) {
        const requireVars = path.value.declarations[0].id;

        const properties = requireVars.properties;
        let pos = 0;
        while (pos < properties.length) {
          const prop = properties[pos];
          if (!prop || prop.type !== 'ObjectProperty' || prop.value.type !== 'Identifier') {
            return;
          }

          const name = prop.value.name;
          if (identifiers.includes(name)) {
            properties.splice(pos, 1);
          }

          pos++;
        }

        if (properties.length > 0) {
          requireVars.properties = properties;
        } else {
          j(path).remove();
        }
      }
    });
}
