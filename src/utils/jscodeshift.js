import { log } from '@clack/prompts';
import { run as jscodeshift } from 'jscodeshift/src/Runner.js';

const JSCODESHIFT_EXTENSIONS = 'js,jsx,ts,tsx,cjs,cts,mjs,mts';

/**
 * Run a jscodeshift transform.
 *
 * @param {string} transformPath
 * @param {string[]} files
 * @param {import('types').RunOptions} options
 */
export async function runJscodeshift(transformPath, files, options) {
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
    log.error('Failed to run jscodeshift transform:');
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
