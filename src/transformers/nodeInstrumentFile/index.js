import path from 'path';
import url from 'url';

import { log } from '@clack/prompts';
import chalk from 'chalk';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Move @sentry/node config into instrument.js file',
  transform: async (files, options) => {
    if (options.sdk !== '@sentry/node') {
      // this transform only applies to the Node SDK
      return;
    }

    log.info(`Moving your Sentry config into a dedicated ${chalk.cyan('instrument.js')} file.

In version 8, the order of importing and initializing Sentry matters a lot.
We therefore move your Sentry initialization into a separate file and import it right on top of your file.
This ensures correct ordering.

More information: ${chalk.gray('https://docs.sentry.io/platforms/javascript/guides/node/#configure')}`);

    log.info(
      `${chalk.underline(
        'Important:'
      )} If you're using EcmaScript Modules (ESM) mode, you need to load the ${chalk.cyan(
        'instrument.js'
      )} file differently.

Please read this guide: ${chalk.gray('https://docs.sentry.io/platforms/javascript/guides/node/install/esm')}

After you've done that, remove import of ${chalk.cyan('instrument.js')} from your file(s).

This only applies if you are actually using ESM natively with Node.
If you use ${chalk.gray('import')} syntax but transpile to CommonJS (e.g. TypeScript), you're all set up already!
`
    );

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');
    await runJscodeshift(transformPath, files, options);
  },
};
