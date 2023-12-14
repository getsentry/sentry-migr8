import path from 'path';
import url from 'url';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Use getCurrentScope() instead of configureScope()',
  transform: async (files, options) => {
    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, files, options);
  },
};
