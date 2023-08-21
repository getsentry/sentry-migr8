import * as path from 'path';

import { intro, outro, select, multiselect, isCancel, spinner } from '@clack/prompts';
import { globby } from 'globby';

import { getTransformers } from './utils/getTransformers.js';
/**
 *
 * @param {import("types").RunOptions} options
 */
export async function run(options) {
  intro('Welcome to sentry-migr8!');
  intro('This command line tool will update your Sentry JavaScript setup to the latest version.');
  intro('We will guide you through the process step by step.');

  const files = (await globby(options.filePatterns, { gitignore: true })).map(relativePath =>
    path.resolve(relativePath)
  );

  // TODO: check if in git repo && no changed files

  const allTransformers = await getTransformers();

  const applyAllTransformers = await select({
    message: 'Do you want to apply all transformers, or only selected ones?',
    options: [
      { value: true, label: 'Apply all transformations.', hint: 'Recommended' },
      { value: false, label: 'I want to select myself.' },
    ],
  });

  if (isCancel(applyAllTransformers)) {
    aborted();
    return;
  }

  let transformers = allTransformers;
  if (!applyAllTransformers) {
    const selectedTransformers = await multiselect({
      message: 'Which transformers do you want to apply?',
      options: allTransformers.map(transformer => {
        return { value: transformer, label: transformer.name };
      }),
    });

    if (isCancel(selectedTransformers)) {
      aborted();
      return;
    }

    transformers = selectedTransformers;
  }

  intro(`Applying ${transformers.length} transformer(s)...`);

  for (const transformer of transformers) {
    const s = spinner();
    s.start(`Running transformer ${transformer.name}...`);

    await transformer.transform(files, options);

    s.stop(`Transform ${transformer.name} completed.`);
  }

  outro('Great, all done!');
}

function aborted() {
  outro('Aborted...');
}
