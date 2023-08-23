import { existsSync } from 'node:fs';
import path from 'node:path';

const YARN_LOCK = 'yarn.lock';
const PNPM_LOCK = 'pnpm-lock.yaml';

/**
 * @type {Record<'yarn'|'npm'|'pnpm', {add: (packages: string, isDevDep: boolean) => string, remove: string}>}
 */
const PACKAGE_MANAGER_APIS = {
  yarn: {
    add: (packages, isDevDep) => `yarn add ${packages} --caret${isDevDep ? ' --dev' : ''}`,
    remove: 'yarn remove',
  },
  pnpm: {
    add: (packages, isDevDep) => `pnpm add ${packages}${isDevDep ? ' --save-dev' : ''}`,
    remove: 'pnpm remove',
  },
  npm: {
    add: (packages, isDevDep) => `npm install ${packages} --caret${isDevDep ? ' --save-dev' : ''}`,
    remove: 'npm uninstall',
  },
};

/**
 *
 * @param {string} cwd
 * @returns {{add: (packages: string, isDevDep: boolean) => string, remove: string}}
 */
export function getPackageManagerAPI(cwd) {
  const packageManager = detectPackageManager(cwd);

  return PACKAGE_MANAGER_APIS[packageManager];
}

/**
 *
 * @param {string} cwd
 * @returns { 'yarn' | 'npm' | 'pnpm'}
 */
function detectPackageManager(cwd) {
  if (existsSync(path.join(cwd, YARN_LOCK))) {
    return 'yarn';
  }
  if (existsSync(path.join(cwd, PNPM_LOCK))) {
    return 'pnpm';
  }

  return 'npm';
}
