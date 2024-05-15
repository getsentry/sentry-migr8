import { runner } from 'clet';

import { getCliPath, getFixturePath, makeTmpDir } from './testPaths.js';

/**
 * Some utilities on top of clet.
 */

/**
 * @param {string} testAppName
 * @param {{ logLevel?: import('clet').LogLevel, timeout?: number, skipGitChecks?: boolean, args?: string[] }} options
 * @returns {import('clet').TestRunner}
 */
export function defaultRunner(
  testAppName,
  { logLevel = LogLevel.INFO, timeout = 10_000, skipGitChecks = true, args } = {}
) {
  const testApp = getFixturePath(testAppName);
  const tmpPath = makeTmpDir(testApp);

  const additionalArgs = args ?? [];

  const res = runner()
    .cwd(tmpPath, { init: true, clean: true })
    .debug(logLevel)
    .timeout(timeout)
    .fork(getCliPath(), skipGitChecks ? ['--skipGitChecks=true', '--disableTelemetry', ...additionalArgs] : [], {});

  return res;
}

/*
  Export some things that are only exported by clet as types - SAD!
 */

export const KEYS = {
  ENTER: '\n\r',
  UP: '\u001b[A',
  DOWN: '\u001b[B',
  LEFT: '\u001b[D',
  RIGHT: '\u001b[C',
  SPACE: ' ',
};

// Some hackery to make this work :O

/**
 * @type {Record<'stdout' | 'stderr' | 'message' | 'close', import('clet').WaitType>}
 */
export const WaitType = {
  /** @type {any} */
  stdout: 'stdout',
  /** @type {any} */
  stderr: 'stderr',
  /** @type {any} */
  message: 'message',
  /** @type {any} */
  close: 'close',
};

/**
  @type {Record<'ERROR' | 'WARN' | 'LOG' | 'INFO' | 'DEBUG' | 'TRACE' | 'Silent' | 'Verbose', import('clet').LogLevel>}
 */
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  LOG: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5,
  Silent: -Infinity,
  Verbose: Infinity,
};
