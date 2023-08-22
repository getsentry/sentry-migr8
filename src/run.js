import * as path from 'path';

import { intro, outro, select, multiselect, spinner, note, log } from '@clack/prompts';
import { globby } from 'globby';
import chalk from 'chalk';

import { getTransformers } from './utils/getTransformers.js';
import { abortIfCancelled, checkGitStatus, getPackageDotJson } from './utils/clackUtils.js';
import { SENTRY_SDK_PACKAGE_NAMES, findInstalledPackageFromList } from './utils/package-json.js';

/**
 *
 * @param {import("types").RunOptions} options
 */
export async function run(options) {
  intro(chalk.inverse('Welcome to sentry-migr8!'));
  note(
    `This command line tool will update your Sentry JavaScript setup to the latest version.

We will guide you through the process step by step.`
  );

  note(`We will run transforms on files matching the following ${
    options.filePatterns.length > 1 ? 'patterns' : 'pattern'
  }, ignoring any gitignored files:
${options.filePatterns.join('\n')}
(You can change this by specifying the --filePatterns option)`);

  const cwd = options.cwd ?? process.cwd();

  const files = (await globby(options.filePatterns, { cwd, gitignore: true })).map(relativePath =>
    path.resolve(relativePath)
  );

  if (!options.skipGitChecks) {
    await checkGitStatus();
  }

  let targetSdk = options.sdk ?? (await detectSdk(cwd));

  const allTransformers = await getTransformers();

  const applyAllTransformers = await abortIfCancelled(
    select({
      message: 'Do you want to apply all transformers, or only selected ones?',
      options: [
        { value: true, label: 'Apply all transformations.', hint: 'Recommended' },
        { value: false, label: 'I want to select myself.' },
      ],
    })
  );

  let transformers = allTransformers;
  if (!applyAllTransformers) {
    const selectedTransformers = await abortIfCancelled(
      multiselect({
        message: 'Which transformers do you want to apply?',
        options: allTransformers.map(transformer => {
          return { value: transformer, label: transformer.name };
        }),
      })
    );

    transformers = selectedTransformers;
  }

  intro(`Applying ${transformers.length} transformer(s)...`);

  for (const transformer of transformers) {
    const s = spinner();
    s.start(`Running transformer "${transformer.name}"...`);

    try {
      await transformer.transform(files, { ...options, sdk: targetSdk });
      s.stop(`Transformer "${transformer.name}" completed.`);
    } catch (error) {
      s.stop(`Transformer "${transformer.name}" failed to complete with error:`);
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  outro('All transformers completed!');
}

/**
 * @param {string} cwd
 * @returns {Promise<string | undefined>}
 */
async function detectSdk(cwd) {
  const sdkPackage = findInstalledPackageFromList(SENTRY_SDK_PACKAGE_NAMES, await getPackageDotJson(cwd));

  const sdkName = sdkPackage ? sdkPackage.name : undefined;

  if (sdkName) {
    log.info(`Detected SDK: ${sdkName}`);
  } else {
    log.info(
      `No Sentry SDK detected. Skipping all import-rewriting transformations.
Specify --sdk if you want to override the detection.`
    );
  }

  return sdkName;
}
