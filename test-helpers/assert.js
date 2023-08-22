import assert from 'assert';

import chalk from 'chalk';

/**
 * Better string comparison assertion.
 * @param {string} actual
 * @param {string} expected
 */
export function assertStringEquals(actual, expected) {
  const actualStr = actual.trim();
  const expectedStr = expected.trim();

  if (actualStr === expectedStr) {
    assert.equal(actualStr, expectedStr);
    return;
  }

  assert.ok(
    false,
    `Strings are not equal:
Expected:
${chalk.green(expectedStr)}

Actual:
${chalk.red(actualStr)}`
  );
}
