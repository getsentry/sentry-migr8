import path from 'node:path';
import url from 'url';

import { log } from '@clack/prompts';
import chalk from 'chalk';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Remove `@sentry/tracing` imports',
  async transform(files, options) {
    if (!options.sdk) {
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, files, options);

    log.info(`This operation might have created duplicated imports from ${chalk.cyan(options.sdk)}
    You might want to clean them up manually afterwards.`);
  },
};
