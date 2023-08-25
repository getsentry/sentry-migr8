import path from 'node:path';
import url from 'url';

import { runJscodeshift } from '../../utils/jscodeshift.js';

/** @type {import('types').Transformer} */
export default {
  name: 'Rewrite Svelte Config',
  async transform(files, options) {
    if (!options.sdk || !['@sentry/svelte', '@sentry/sveltekit'].includes(options.sdk)) {
      // No need to run this transformer if the SDK is not a Svelte SDK (or not specified at all)
      return;
    }

    // The only file this transformer touches svelte.config.js.
    // Using filter for the remote chance that there's more than one such a file (monorepos?)
    const svelteConfigs = files.filter(file => path.basename(file) === 'svelte.config.js');

    if (!svelteConfigs.length) {
      return;
    }

    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await runJscodeshift(transformPath, svelteConfigs, options);
  },
};
