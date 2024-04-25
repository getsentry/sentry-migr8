import path from 'node:path';
import url from 'url';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Remove `@sentry/integrations` imports',
  async transform(files, options) {
    if (!options.sdk) {
      // No need to run this transformer if no SDK is specificied/deteced
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, files, options);
  },
};
