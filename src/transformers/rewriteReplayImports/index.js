import path from 'node:path';
import url from 'url';

import { runJscodeshift } from '../../utils/jscodeshift.js';
import { isServerSdk } from '../../utils/package-json.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Remove `@sentry/replay` imports',
  async transform(files, options) {
    if (!options.sdk || isServerSdk(options.sdk)) {
      // No need to run this transformer on server SDKs or if no SDK is specificied/deteced
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, files, options);
  },
};
