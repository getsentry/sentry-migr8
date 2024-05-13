import * as path from 'path';

import { intro, outro, select, multiselect, spinner, note, log } from '@clack/prompts';
import { globby } from 'globby';
import chalk from 'chalk';
import * as Sentry from '@sentry/node';

import { getTransformers } from './utils/getTransformers.js';
import {
  abortIfCancelled,
  checkGitStatus,
  checkIsInWorkspace,
  getPackageDotJson,
  maybeRunPrettier,
} from './utils/clackUtils.js';
import { SENTRY_SDK_PACKAGE_NAMES, findInstalledPackageFromList } from './utils/package-json.js';
import { traceStep, withTelemetry } from './utils/telemetry.js';

process.setMaxListeners(0);

/**
 *
 * @param {import("types").RunOptions} options
 */
export async function run(options) {
  withTelemetry({ enabled: !options.disableTelemetry }, () => runWithTelemetry(options));
}

/**
 * @param {import("types").RunOptions} options
 */
export async function runWithTelemetry(options) {
  traceStep('intro', () => {
    intro(chalk.inverse('Welcome to sentry-migr8!'));
    note(
      `This command line tool will update your Sentry JavaScript setup to the latest version.

  We will guide you through the process step by step.${
    !options.disableTelemetry
      ? `
  This tool collects anonymous telemetry data and sends it to Sentry.
  You can disable this by passing the --disableTelemetry option.`
      : ''
  }`
    );

    note(`We will run code transforms on files matching the following ${
      options.filePatterns.length > 1 ? 'patterns' : 'pattern'
    }, ignoring any .gitignored files:

  ${options.filePatterns.join('\n')}

  (You can change this by specifying the --filePatterns option)`);
  });

  const cwd = options.cwd ?? process.cwd();
  const ignore =
    options.ignoreFilePatterns && options.ignoreFilePatterns.length > 0 ? options.ignoreFilePatterns : undefined;

  const files = (await globby(options.filePatterns, { cwd, gitignore: true, ignore })).map(relativePath =>
    path.resolve(relativePath)
  );

  if (!options.skipGitChecks) {
    await traceStep('check-git-status', checkGitStatus);
  }

  const packageJSON = await getPackageDotJson(cwd);

  await traceStep('check-in-workspace', () => checkIsInWorkspace(packageJSON));

  let targetSdk = options.sdk ?? detectSdk(packageJSON);

  const allTransformers = await getTransformers();

  const applyAllTransformers = await traceStep('ask-apply-all-transformers', async () =>
    abortIfCancelled(
      select({
        message: 'Do you want to apply all code transforms, or only selected ones?',
        options: [
          { value: true, label: 'Apply all transformations.', hint: 'Recommended' },
          { value: false, label: 'I want to select myself.' },
        ],
      })
    )
  );

  Sentry.setTag('apply-all-transformers', applyAllTransformers);

  let transformers = allTransformers;
  if (!applyAllTransformers) {
    const selectedTransformers = await traceStep('select-transformers', () =>
      abortIfCancelled(
        multiselect({
          message: 'Which transformers do you want to apply?',
          options: allTransformers.map(transformer => {
            return { value: transformer, label: transformer.name };
          }),
        })
      )
    );

    transformers = selectedTransformers;
  }

  log.step(`Applying ${transformers.length} transformer(s)...`);

  await traceStep('run-transformers', async () => {
    for (const transformer of transformers) {
      const showSpinner = !transformer.requiresUserInput;

      const s = spinner();
      if (showSpinner) {
        s.start(`Running transformer "${transformer.name}"...`);
      }

      try {
        await traceStep(transformer.name, () => transformer.transform(files, { ...options, sdk: targetSdk }));
        if (showSpinner) {
          s.stop(`Transformer "${transformer.name}" completed.`);
        }
      } catch (error) {
        if (showSpinner) {
          s.stop(`Transformer "${transformer.name}" failed to complete with error:`);
        }
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  });

  await traceStep('prettier', () => maybeRunPrettier(cwd, packageJSON));

  await traceStep('outro', () => {
    log.success('All transformers completed!');
    outro('Thank you for using @sentry/migr8!');
  });
}

/**
 * @param {import('types').PackageDotJson} packageJSON
 * @returns {string | undefined}
 */
function detectSdk(packageJSON) {
  const sdkPackage = findInstalledPackageFromList(SENTRY_SDK_PACKAGE_NAMES, packageJSON);

  const sdkName = sdkPackage ? sdkPackage.name : undefined;

  if (sdkName) {
    log.info(`Detected SDK: ${chalk.cyan(sdkName)}`);
  } else {
    log.info(
      `No Sentry SDK detected. Skipping all import-rewriting transformations.
Specify --sdk if you want to override the detection.`
    );
  }

  return sdkName;
}
