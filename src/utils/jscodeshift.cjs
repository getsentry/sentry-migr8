// These are utils for the transform.cjs files, which cannot require .js (esm) files

/**
 * Checks if a file content has a Sentry import or require.
 * By default checks for _any_ @sentry/xxx import, but you can also specify a package name.
 *
 * @param {string} source
 * @param {string | undefined} packageName
 * @returns {boolean}
 */
function hasSentryImportOrRequire(source, packageName = '@sentry/(.+)') {
  /* eslint-disable quotes */
  const importRegex = new RegExp(`from ['"]${packageName}['"]`, 'gim');
  const requireRegex = new RegExp(`require\\(['"]${packageName}['"]\\)`, 'gim');
  /* eslint-enable quotes */

  return importRegex.test(source) || requireRegex.test(source);
}

module.exports = {
  hasSentryImportOrRequire,
};
