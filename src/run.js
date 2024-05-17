import * as path from 'path';

import { intro, outro, select, multiselect, spinner, note, log } from '@clack/prompts';
import { globby } from 'globby';
import chalk from 'chalk';
import * as Sentry from '@sentry/node';
import { minVersion } from 'semver';

import { getTransformers } from './utils/getTransformers.js';
import {
  abort,
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
  Sentry.metrics.increment('executions');

  printIntroMessages(options);

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

  /** @type {import('types').NpmPackage} */
  let targetSdk =
    options.sdk && options.currentVersion
      ? { name: options.sdk, version: options.currentVersion }
      : await getSdk(packageJSON);

  log.info(`Your Sentry SDK: ${chalk.cyan(`${targetSdk.name}@${targetSdk.version}`)}`);

  const targetSdkMinVersion = minVersion(targetSdk.version);

  await exitIfSdkVersionTooOld(targetSdkMinVersion, targetSdk);

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

  Sentry.setTag('apply-all-transformers', !!applyAllTransformers);
  Sentry.metrics.distribution('apply-all-transformers', applyAllTransformers ? 1 : 0, { unit: 'percent' });

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
      Sentry.metrics.set('transforms.selected', transformer.name);
      const showSpinner = !transformer.requiresUserInput;

      const s = spinner();
      if (showSpinner) {
        s.start(`Running transformer "${transformer.name}"...`);
      }

      try {
        await traceStep(transformer.name, () => transformer.transform(files, { ...options, sdk: targetSdk.name }));
        if (showSpinner) {
          s.stop(`Transformer "${transformer.name}" completed.`);
        }
        Sentry.metrics.set('transforms.success', transformer.name);
      } catch (error) {
        if (showSpinner) {
          s.stop(`Transformer "${transformer.name}" failed to complete with error:`);
        }
        // eslint-disable-next-line no-console
        console.error(error);
        Sentry.metrics.set('transforms.fail', transformer.name);
      }
    }
  });

  await traceStep('prettier', () => maybeRunPrettier(cwd, packageJSON));

  await traceStep('outro', () => {
    log.success('All transformers completed!');
    outro('Thank you for using @sentry/migr8!');
  });

  Sentry.metrics.increment('executions.success');
  Sentry.getActiveSpan()?.setStatus('ok');
}

/**
 *
 * @param {import('semver').SemVer | null} targetSdkMinVersion
 * @param {import('types').NpmPackage} targetSdk
 */
async function exitIfSdkVersionTooOld(targetSdkMinVersion, targetSdk) {
  if (!targetSdkMinVersion || targetSdkMinVersion.major < 7) {
    log.error(
      `Your Sentry SDK version ${chalk.cyan(targetSdk.version)} is too old. Please upgrade to at least ${chalk.cyan(
        '7.x'
      )} to use this tool.`
    );
    Sentry.metrics.increment('executions.fail', 1, { tags: { reason: 'sdk-too-old' } });
    await abort('Exiting, please run this tool again after upgrading your SDK.', 0);
  }
}

/**
 * @param {import("types").RunOptions} options
 */
function printIntroMessages(options) {
  traceStep('intro', () => {
    intro(chalk.inverse('Welcome to sentry-migr8!'));
    note(
      `We will guide you through the process step by step.${
        !options.disableTelemetry
          ? `

We're collecting anonymous telemetry data and sends it to Sentry improve migr8.
You can disable this by passing the ${chalk.cyan('--disableTelemetry')} option.`
          : ''
      }`,
      'This tool helps you update your Sentry JavaScript SDK'
    );

    note(`We will run code transforms on files matching the following ${
      options.filePatterns.length > 1 ? 'patterns' : 'pattern'
    }, ignoring any .gitignored files:

${chalk.cyan(options.filePatterns.join('\n'))}

(You can change this by specifying the ${chalk.cyan('--filePatterns')} option)`);
  });
}

/**
 * @param {import('types').PackageDotJson} packageJSON
 * @returns {Promise<import('types').NpmPackage>}
 */
async function getSdk(packageJSON) {
  const sdkPackage = findInstalledPackageFromList(SENTRY_SDK_PACKAGE_NAMES, packageJSON);

  if (sdkPackage) {
    return sdkPackage;
  }

  log.warn(
    `Couldn't detect your Sentry SDK. This sometimes happens if we can't read your ${chalk.cyan('package.json')}`
  );
  const selectedSdk = await abortIfCancelled(
    select({
      message: 'To continue, please select your Sentry SDK:',
      options: SENTRY_SDK_PACKAGE_NAMES.map(sdk => ({ value: sdk, label: sdk })).sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
      maxItems: 12,
    })
  );

  const selectedSdkVersion = await abortIfCancelled(
    select({
      message: `Which version of ${chalk.cyan(selectedSdk)} are you currently using?`,
      options: [
        { value: '7.x', label: '7.x' },
        { value: '8.x', label: '8.x' },
        { value: '6.x', label: '6.x or older' },
      ],
    })
  );

  return { name: selectedSdk, version: selectedSdkVersion };
}
