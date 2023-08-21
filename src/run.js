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

  const files = (await globby(options.filePatterns, { gitignore: true })).map(relativePath =>
    path.resolve(relativePath)
  );

  if (!options.skipGitChecks) {
    await checkGitStatus();
  }

  let targetSdk = options.sdk ?? (await detectSdk());

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
    s.start(`Running transformer ${transformer.name}...`);

    await transformer.transform(files, { ...options, sdk: targetSdk });

    s.stop(`Transformer ${transformer.name} completed.`);
  }

  outro('All transformers completed!');
}

/**
 * @returns {Promise<string>}
 */
async function detectSdk() {
  const sdkPackage = findInstalledPackageFromList(SENTRY_SDK_PACKAGE_NAMES, await getPackageDotJson());

  const sdkName = sdkPackage ? sdkPackage.name : '@sentry/browser';

  log.info(`Detected SDK: ${sdkName}`);

  return sdkName;
}
