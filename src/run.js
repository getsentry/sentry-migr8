import { globby } from 'globby';

import * as path from 'path';

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

  console.log(files, transformerOptions);
}
