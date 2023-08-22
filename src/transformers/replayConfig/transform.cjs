/**
 * This transform converts old replay privacy options to their new format.
 * Specifically, it handles these:
 *
 * blockSelector: '.my-blocks-selector,[my-block-attr]',
 * blockClass: 'my-block-class',
 * ignoreClass: 'my-ignore-class',
 * maskTextClass: 'my-mask-text-class',
 * maskTextSelector: '.my-mask-text-selector,[my-mask-text-attr]',
 *
 * For now, it does not handle `maskInputOptions: { email: true, text: false },` yet.
 *
 * @type {import('jscodeshift').Transform}
 */
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;

  let block = j.arrayExpression([]);
  let ignore = j.arrayExpression([]);
  let mask = j.arrayExpression([]);

  const source = fileInfo.source;

  // First find new XX.Replay()
  const newReplayExpression = getReplayNewExpression(j, source);

  // If no new Replay() found, nothing to do
  if (!newReplayExpression) {
    return undefined;
  }

  // Short circuit: If none of the "old" options are used, we just bail (=nothing to do)
  if (!/(blockSelector)|(blockClass)|(ignoreClass)|(maskTextClass)|(maskTextSelector)/gim.test(source)) {
    return;
  }

  // Now find properties inside of new Replay()
  newReplayExpression.find(j.ObjectProperty).forEach(path => {
    if (path.value.key.type !== 'Identifier') {
      return;
    }

    const keyName = path.value.key.name;

    // Find arrays for existing properties (e.g. block: ['aa', 'bb'])
    if (path.value.value.type === 'ArrayExpression') {
      /*
        We want to handle these:
        block: ['aa', 'bb'],
        ignore: ['aa', 'bb'],
        mask: ['aa', 'bb']
      */

      if (keyName === 'block') {
        block = mergeArrayExpressions(j, block, path.value.value);
        j(path).remove();
        return;
      }

      if (keyName === 'ignore') {
        ignore = mergeArrayExpressions(j, ignore, path.value.value);
        j(path).remove();
        return;
      }

      if (keyName === 'mask') {
        mask = mergeArrayExpressions(j, mask, path.value.value);
        j(path).remove();
        return;
      }
    }

    // Find string literals values
    if (path.value.value.type === 'StringLiteral') {
      /*
       We want to handle these:
        blockSelector: '.my-blocks-selector,[my-block-attr]',
        blockClass: 'my-block-class',
        ignoreClass: 'my-ignore-class',
        maskTextClass: 'my-mask-text-class',
        maskTextSelector: '.my-mask-text-selector,[my-mask-text-attr]',
      */

      const value = path.value.value.value;

      if (keyName === 'blockSelector') {
        block.elements.push(...convertSelector(value).map(v => j.literal(v)));
        j(path).remove();
        return;
      }
      if (keyName === 'blockClass') {
        block.elements.push(...convertClassName(value).map(v => j.literal(v)));
        j(path).remove();
        return;
      }
      if (keyName === 'ignoreClass') {
        ignore.elements.push(...convertClassName(value).map(v => j.literal(v)));
        j(path).remove();
        return;
      }
      if (keyName === 'maskTextClass') {
        mask.elements.push(...convertClassName(value).map(v => j.literal(v)));
        j(path).remove();
        return;
      }
      if (keyName === 'maskTextSelector') {
        mask.elements.push(...convertSelector(value).map(v => j.literal(v)));
        j(path).remove();
        return;
      }
    }
  });

  // Finally, actually update the options object
  newReplayExpression.forEach(path => {
    const arg = path.value.arguments[0];

    if (arg.type !== 'ObjectExpression') {
      return;
    }

    if (block.elements.length > 0) {
      arg.properties.push(j.property('init', j.identifier('block'), block));
    }
    if (ignore.elements.length > 0) {
      arg.properties.push(j.property('init', j.identifier('ignore'), ignore));
    }
    if (mask.elements.length > 0) {
      arg.properties.push(j.property('init', j.identifier('mask'), mask));
    }
  });

  return newReplayExpression.toSource();
};

/**
 * @param {string} selector
 * @returns {string[]}
 */
function convertSelector(selector) {
  return selector.split(',');
}

/**
 * @param {string} className
 * @returns {string[]}
 */
function convertClassName(className) {
  return className ? [`.${className}`] : [];
}

/**
 *
 * @param {import('jscodeshift')} j
 * @param {string} source
 * @returns {undefined | import('jscodeshift').Collection<import('jscodeshift').NewExpression>}
 */
function getReplayNewExpression(j, source) {
  // First try to find new XX.Replay()
  const a = j(source).find(j.NewExpression, { callee: { property: { name: 'Replay' } } });

  if (a.size() > 0) {
    return a;
  }

  // Else try new Replay()
  const b = j(source).find(j.NewExpression, { callee: { name: 'Replay' } });
  if (b.size() > 0) {
    return b;
  }

  return undefined;
}

/**
 *
 * @param {import('jscodeshift')} j
 * @param {import('jscodeshift').ArrayExpression} existing
 * @param {import('jscodeshift').ArrayExpression} added
 * @returns {import('jscodeshift').ArrayExpression}
 */
function mergeArrayExpressions(j, existing, added) {
  // If no elements added yet, just use the added one
  if (existing.elements.length === 0) {
    return added;
  }

  // Else, make sure to add the added elements to the exsiting one
  return j.arrayExpression([...existing.elements, ...added.elements]);
}
