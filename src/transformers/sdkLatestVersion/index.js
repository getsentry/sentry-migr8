import path from 'path';
import { existsSync } from 'fs';
import { execSync } from 'node:child_process';

import { log } from '@clack/prompts';

import { getPackageDotJson, debugLog, debugError } from '../../utils/clackUtils.js';

const PACKAGES_TO_REMOVE = ['@sentry/tracing', '@sentry/replay', '@sentry/hub'];

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Update SDK to latest version',
  transform: async (files, options) => {
    const cwd = options.cwd ?? process.cwd();
    const packageAPI = getPackageManagerAPI(cwd);
    const packageJSON = await getPackageDotJson(cwd);

    // Do nothing if we have no root package.json
    if (!packageJSON) {
      return;
    }

    if (packageJSON.workspaces) {
      log.warn(
        'It seems you are in a workspace, cannot update the SDK version. Try to run this command in the subpackages themselves.'
      );
      return;
    }

    const dependencies = Object.keys(packageJSON.dependencies || {});
    const devDependencies = Object.keys(packageJSON.devDependencies || {});

    const allDependencies = [...dependencies, ...devDependencies];

    const toRemove = allDependencies.filter(dep => PACKAGES_TO_REMOVE.includes(dep));
    const toUpdateDep = dependencies.filter(dep => !PACKAGES_TO_REMOVE.includes(dep) && dep.startsWith('@sentry/'));
    const toUpdateDevDep = devDependencies.filter(
      dep => !PACKAGES_TO_REMOVE.includes(dep) && dep.startsWith('@sentry/')
    );

    if (!toRemove.length && !toUpdateDep.length && !toUpdateDevDep.length) {
      debugLog('No SDK dependencies found, skipping...', options.debug);
      return;
    }

    try {
      if (toRemove.length > 0) {
        const removeCommand = `${packageAPI.remove} ${toRemove.join(' ')}`;
        debugLog(`Running:  ${removeCommand}`, options.debug);
        execSync(removeCommand, {
          stdio: 'ignore',
          cwd,
        });
      }

      if (toUpdateDep.length > 0) {
        const addCommand = packageAPI.add(toUpdateDep.map(dep => `${dep}@latest`).join(' '), false);
        debugLog(`Running:  ${addCommand}`, options.debug);
        execSync(addCommand, {
          cwd,
          stdio: 'ignore',
        });
      }

      if (toUpdateDevDep.length > 0) {
        const addCommand = packageAPI.add(toUpdateDevDep.map(dep => `${dep}@latest`).join(' '), true);
        debugLog(`Running:  ${addCommand}`, options.debug);
        execSync(addCommand, {
          cwd,
          stdio: 'ignore',
        });
      }
    } catch (e) {
      debugError(`Error while updating SDK: ${e}`, options.debug);
      // ignore errors?
    }
  },
};

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
function getPackageManagerAPI(cwd) {
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
