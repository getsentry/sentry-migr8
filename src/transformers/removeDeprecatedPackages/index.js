import { execSync } from 'node:child_process';

import { log } from '@clack/prompts';

import { getPackageDotJson, debugLog, debugError } from '../../utils/clackUtils.js';
import { getPackageManagerAPI } from '../../utils/packageManager.js';

const PACKAGES_TO_REMOVE = ['@sentry/tracing', '@sentry/replay', '@sentry/hub', '@sentry/integrations'];

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Remove deprecated packages',
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

    if (!toRemove.length) {
      debugLog('No package to remove found, skipping...', options.debug);
      return;
    }

    try {
      const removeCommand = `${packageAPI.remove} ${toRemove.join(' ')}`;
      debugLog(`Running:  ${removeCommand}`, options.debug);
      execSync(removeCommand, {
        stdio: 'ignore',
        cwd,
      });
    } catch (e) {
      debugError(`Error while removing packages: ${e}`, options.debug);
      // ignore errors?
    }
  },
};
