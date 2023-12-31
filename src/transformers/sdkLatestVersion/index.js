import { execSync } from 'node:child_process';

import { log } from '@clack/prompts';

import { getPackageDotJson, debugLog, debugError } from '../../utils/clackUtils.js';
import { getPackageManagerAPI } from '../../utils/packageManager.js';

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

    const toUpdateDep = dependencies.filter(dep => dep.startsWith('@sentry/'));
    const toUpdateDevDep = devDependencies.filter(dep => dep.startsWith('@sentry/'));

    if (!toUpdateDep.length && !toUpdateDevDep.length) {
      debugLog('No SDK dependencies found, skipping...', options.debug);
      return;
    }

    try {
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
