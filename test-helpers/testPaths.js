import path from 'path';

/**
 * @returns {string}
 */
export function getCliPath() {
  return path.join(process.cwd(), './src/index.js');
}

/**
 *
 * @param {string} testAppName
 * @returns {string}
 */
export function getFixturePath(testAppName) {
  return path.resolve(path.join(process.cwd(), 'test-fixtures', testAppName));
}
