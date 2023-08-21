import * as path from 'path';

import { globby } from 'globby';

/**
 * @param {import("types").RunOptions} options
 */
export async function run(options) {
  const files = (await globby(options.filePatterns, { gitignore: true })).map(relativePath =>
    path.resolve(relativePath)
  );
  const transformerOptions = {
    debug: options.debug,
  };

  // TODO: check if in git repo && no changed files

  // eslint-disable-next-line no-console
  console.log(files, transformerOptions);
}
