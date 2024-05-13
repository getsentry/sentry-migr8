import path from 'path';
import url from 'url';

import { confirm, log, select } from '@clack/prompts';
import chalk from 'chalk';

import { runJscodeshift } from '../../utils/jscodeshift.js';
import { abortIfCancelled } from '../../utils/clackUtils.js';

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Move @sentry/node config into instrument.js file',
  requiresUserInput: true,
  transform: async (files, options) => {
    if (options.sdk !== '@sentry/node') {
      // this transform only applies to the Node SDK
      return;
    }

    log.info(`Attempting to move your Sentry config into a dedicated ${chalk.cyan('instrument.js')} file.

In version 8, the order of importing and initializing Sentry matters a lot.
We therefore recommend moving your Sentry initialization into a separate file.

More information: ${chalk.gray('https://docs.sentry.io/platforms/javascript/guides/node/#configure')}`);

    const shouldApplyTransform = await abortIfCancelled(
      confirm({
        message: 'Do you want to continue with this change?',
        active: 'Yes, create the file',
        inactive: "No, I'll do this myself later.",
      })
    );

    if (!shouldApplyTransform) {
      log.info('Skipping this change, remember to do it later, this is important!');
      return;
    }

    log.info(`Great! I will move your Sentry config into a new file. We're not done though.

We also need to make sure that this file is imported before anything else in your application.

There are two options:

- Run your app with ${chalk.cyan('node --require instrument.js index.js')} CLI argument
- Import ${chalk.cyan('instrument.js')} on top of your entry point (This will only work in CJS node apps)
`);

    const shouldInsertImport = await abortIfCancelled(
      select({
        message: 'What do you want to do?',
        options: [
          {
            value: false,
            label: "I'll run my app with the CLI argument",
            hint: 'Recommended but you need to do this yourself',
          },
          {
            value: true,
            label: 'Add the import for instrument.js on top of my file',
            hint: 'Only works in CJS node apps',
          },
        ],
      })
    );

    if (shouldInsertImport) {
      log.info('Great! I will add the import for you in the file(s) where you configure Sentry.');
    } else {
      log.info(`Great! From now on, make sure to run your app with the following command:
- ESM: ${chalk.cyan('node --import instrument.js your-app.js')}
- CJS: ${chalk.cyan('node --require instrument.js your-app.cjs')}`);
    }

    options.transformOptions = {
      ...options.transformOptions,
      'nodeInstrumentFile:add-import': shouldInsertImport,
    };

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');
    await runJscodeshift(transformPath, files, options);
  },
};
