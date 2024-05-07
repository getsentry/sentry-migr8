import path from 'path';
import url from 'url';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Move @sentry/node config into instrument.js file',
  transform: async (files, options) => {
    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, files, options);
  },
};
