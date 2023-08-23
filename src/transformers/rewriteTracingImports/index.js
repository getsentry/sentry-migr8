import path from 'node:path';
import url from 'url';

import { run as jscodeshift } from 'jscodeshift/src/Runner.js';

import { JSCODESHIFT_EXTENSIONS } from '../../utils/jscodeshift.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Remove `@sentry/tracing` imports',
  async transform(files, options) {
    if (!options.sdk) {
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    /** @type {import('jscodeshift').Options} */
    const jsCodeshiftOptions = {
      dry: options.dry,
      print: options.dry,
      silent: !options.debug,
      verbose: options.debug ? 2 : 0,
      extensions: JSCODESHIFT_EXTENSIONS,
      parser: 'tsx',
      sentry: {
        ...options,
      },
    };

    try {
      await jscodeshift(transformPath, files, jsCodeshiftOptions);
    } catch (e) {
      console.error(e);
    }
  },
};
