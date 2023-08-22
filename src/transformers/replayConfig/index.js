import path from 'path';
import url from 'url';

import { run as jscodeshift } from 'jscodeshift/src/Runner.js';

import { JSCODESHIFT_EXTENSIONS } from '../../utils/jscodeshift.js';

/**
 * @type {import('types').Transformer}
 */
export default {
  name: 'Replay Config v7>v8',
  transform: async (files, options) => {
    const transformPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), './transform.cjs');

    await jscodeshift(transformPath, files, {
      dry: options.dry,
      print: options.dry,
      silent: !options.debug,
      verbose: options.debug ? 2 : 0,
      extensions: JSCODESHIFT_EXTENSIONS,
      parser: 'tsx',
    });
  },
};
