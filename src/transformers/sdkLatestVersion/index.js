import path from 'path';
import { existsSync } from 'fs';
import { execSync } from 'node:child_process';

import { log } from '@clack/prompts';

import { getPackageDotJson } from '../../utils/clackUtils.js';

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

    if (!hasSentryDependency({ ...packageJSON.dependencies, ...packageJSON.devDependencies })) {
      return;
    }

    try {
      execSync(`${packageAPI.remove} @sentry/tracing @sentry/replay @sentry/hub`, {
        stdio: 'ignore',
        cwd,
      });

      if (options.sdk) {
        execSync(packageAPI.add(`${options.sdk}@latest`), {
          cwd,
          stdio: 'ignore',
        });
      }
    } catch (e) {
      // ignore errors?
    }
  },
};

const YARN_LOCK = 'yarn.lock';
const PNPM_LOCK = 'pnpm-lock.yaml';

/**
 * @type {Record<'yarn'|'npm'|'pnpm', {add: (packages: string) => string, remove: string}>}
 */
const PACKAGE_MANAGER_APIS = {
  yarn: {
    add: packages => `yarn add ${packages} --caret`,
    remove: 'yarn remove',
  },
  pnpm: {
    add: packages => `pnpm add ${packages}`,
    remove: 'pnpm remove',
  },
  npm: {
    add: packages => `npm install ${packages} --caret`,
    remove: 'npm uninstall',
  },
};

/**
 *
 * @param {string} cwd
 * @returns {{add: (packages: string) => string, remove: string}}
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

/**
 *
 * @param {Record<string, string>} deps
 * @returns {boolean}
 */
function hasSentryDependency(deps) {
  return Object.keys(deps).some(dep => dep.startsWith('@sentry/'));
}
