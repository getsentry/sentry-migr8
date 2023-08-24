import path from 'node:path';
import url from 'url';
import { execSync } from 'node:child_process';

import { runJscodeshift } from '../../utils/jscodeshift.js';
import { getPackageManagerAPI } from '../../utils/packageManager.js';
import { debugLog } from '../../utils/clackUtils.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Remove `@sentry/hub` imports',
  async transform(files, options) {
    if (!options.sdk) {
      // No need to run this transformer if no SDK is specificied/deteced
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    const codeShiftOptions = await runJscodeshift(transformPath, files, options);

    if (typeof codeShiftOptions.sentry?._needsCore === 'boolean' && codeShiftOptions.sentry?._needsCore) {
      const cwd = options.cwd ?? process.cwd();
      const pacMan = getPackageManagerAPI(cwd);
      const addCommand = pacMan.add('@sentry/core', false);
      debugLog(`Running:  ${addCommand}`, options.debug);
      execSync(addCommand, {
        cwd,
        stdio: 'ignore',
      });
    }
  },
};
