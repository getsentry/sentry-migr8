#!/usr/bin/env node
import { satisfies } from 'semver';
import * as clack from '@clack/prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { run } from './run.js';
import { JSCODESHIFT_EXTENSIONS } from './utils/jscodeshift.js';

const NODE_VERSION_RANGE = '>=18';

if (!satisfies(process.version, NODE_VERSION_RANGE)) {
  clack.log.error(
    `sentry-migr8 requires Node.js ${NODE_VERSION_RANGE}. You are using Node.js ${process.version}. Please upgrade your Node.js version.`
  );
  process.exit(1);
}

async function _run() {
  const argv = await yargs(hideBin(process.argv))
    .option('filePatterns', {
      alias: 'f',
      describe: 'Glob pattern which files should be transformed',
      default: [`**/*.{${JSCODESHIFT_EXTENSIONS}}`],
      type: 'string',
      array: true,
    })
    .option('ignoreFilePatterns', {
      alias: 'if',
      describe: 'Glob pattern which files should be ignored',
      default: [],
      type: 'string',
      array: true,
    })
    .option('debug', {
      default: false,
      describe: 'Enable verbose logging',
      type: 'boolean',
    })
    .option('skipGitChecks', {
      default: false,
      describe: 'Skip git status checks',
      type: 'boolean',
    })
    .option('sdk', {
      type: 'string',
      array: false,
      describe:
        "The SDK you want to apply the migrations for. By default, migr8 will try to auto-detect the SDK. If you want to override this, you set the SDK's full name (e.g. '@sentry/browser').",
    })
    .option('currentVersion', {
      type: 'string',
      describe:
        'The current version of your SDK. By default, migr8 will try to auto-detect the version. You can set the exact version (e.g. 7.44.0) or a specific range (e.g. ^7.47.0).',
    })
    .option('cwd', {
      type: 'string',
      describe: 'The cwd dir to use. Defaults to process.cwd().',
    })
    .option('disableTelemetry', {
      type: 'boolean',
      describe: 'Disable collecting and sending telemetry data to Sentry',
      default: false,
    })
    .wrap(Math.min(yargs().terminalWidth(), 120))
    .parse();

  await run(argv);
}

void _run();
