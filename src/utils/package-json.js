export const SENTRY_SDK_PACKAGE_NAMES = [
  // SDKs using other framework SDKs need to be checked first
  '@sentry/gatsby',
  '@sentry/nextjs',
  '@sentry/remix',
  '@sentry/sveltekit',

  // Framework SDKs
  '@sentry/angular',
  '@sentry/angular-ivy',
  '@sentry/ember',
  '@sentry/react',
  '@sentry/svelte',
  '@sentry/vue',
  '@sentry/serverless',

  // Base SDKs
  '@sentry/browser',
  '@sentry/node',
];

/**
 * Checks if @param packageJson has any of the @param packageNamesList package names
 * listed as a dependency or devDependency.
 * If so, it returns the first package name that is found, including the
 * version (range) specified in the package.json.
 *
 * @param {string[]} packageNamesList
 * @param {import('types').PackageDotJson} packageJson
 *
 * @returns {import('types').NpmPackage | undefined}
 */
export function findInstalledPackageFromList(packageNamesList, packageJson) {
  return packageNamesList
    .map(
      packageName =>
        /** @type {import('types').NpmPackage | undefined} */ ({
          name: packageName,
          version: getPackageVersion(packageName, packageJson),
        })
    )
    .find(sdkPackage => sdkPackage && !!sdkPackage.version);
}

/**
 * @param {string} packageName
 * @param {import('types').PackageDotJson} packageJson
 * @returns {boolean}
 */
export function hasPackageInstalled(packageName, packageJson) {
  return getPackageVersion(packageName, packageJson) !== undefined;
}

/**
 * @param {string} packageName
 * @param {import('types').PackageDotJson} packageJson
 * @returns {string | undefined}
 */
function getPackageVersion(packageName, packageJson) {
  return packageJson?.dependencies?.[packageName] || packageJson?.devDependencies?.[packageName];
}
