#!/usr/bin/env node
import { satisfies } from 'semver';
import * as clack from '@clack/prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { run } from './run.js';

const NODE_VERSION_RANGE = '>=18';

if (!satisfies(process.version, NODE_VERSION_RANGE)) {
  clack.log.error(
    `sentry-migr8 requires Node.js ${NODE_VERSION_RANGE}. You are using Node.js ${process.version}. Please upgrade your Node.js version.`
  );
  process.exit(1);
}

async function _run() {
  const argv = await yargs(hideBin(process.argv))
    .option('files', {
      alias: 'f',
      describe: 'Glob pattern which files should be transformed',
      default: ['**/*.{js,jsx,ts,tsx,mjs,cjs,mts}'],
    })
    .option('debug', {
      default: false,
      describe: 'Enable verbose logging',
      type: 'boolean',
    })
    .parse();

  await run(argv);
}

void _run();
