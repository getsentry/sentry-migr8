import * as childProcess from 'node:child_process';
import { promises as fsPromises } from 'node:fs';
import * as path from 'node:path';

import { cancel, isCancel, confirm, log, spinner } from '@clack/prompts';

import { findInstalledPackageFromList } from './package-json.js';
import { JSCODESHIFT_EXTENSIONS } from './jscodeshift.js';
import { getPackageManagerAPI } from './packageManager.js';

/**
 * Users can cancel at every input (Cmd+c). Clack returns a symbol for that case which we need to check for.
 * This helper just aborts the process if the input was indeed cancelled and returns the input otherwise.
 *
 * @template T
 * @param {T | Promise<T>} input
 * @returns {Promise<Exclude<T, symbol>>}
 */
export async function abortIfCancelled(input) {
  if (isCancel(await input)) {
    cancel('Migr8 run cancelled, see you next time :)');
    process.exit(0);
  } else {
    // @ts-ignore
    return /** @type {Exclude<T, symbol>} */ input;
  }
}

/**
 * Checks if the user is inside a git repository and if there are uncommitted changes.
 * Users can continue in both cases but we want to make sure they know what they're doing.
 * TODO: Right now, this does not detect it when only new files are added, only if files are modified
 *
 * @returns {Promise<void>}
 */
export async function checkGitStatus() {
  const inGitRepo = isInGitRepo();

  if (!inGitRepo) {
    const continueWithoutGit = await abortIfCancelled(
      confirm({
        message:
          'You are not inside a git repository. Migr8 will modify and update some of your files. Do you still want to continue?',
        initialValue: false,
      })
    );

    if (!continueWithoutGit) {
      abort();
    }
    // No need to check for changed files if not in repo!
    return;
  }

  const hasChanges = hasChangedFiles();
  if (hasChanges) {
    const continueWithChanges = await abortIfCancelled(
      confirm({
        message: 'You have uncommitted changes in your git repository. Do you still want to continue?',
        initialValue: false,
      })
    );

    if (!continueWithChanges) {
      abort();
    }
  }
}

/**
 *
 * @param {import('types').PackageDotJson} packageJSON
 * @returns {Promise<boolean>}
 */
export async function checkIsInWorkspace(packageJSON) {
  if (!packageJSON.workspaces) {
    return false;
  }

  const continueInWorkspace = await abortIfCancelled(
    confirm({
      message:
        'It seems you are running migr8 in a workspace. We recommend to run it in the subpackages themselves. Do you still want to continue?',
      initialValue: false,
    })
  );

  if (!continueInWorkspace) {
    abort();
    return false;
  }

  return true;
}

/**
 * Checks if the user is inside a git repository.
 * If not, it asks the user if they want to continue, otherwise we're fine.
 *
 * @returns {boolean}
 */
function isInGitRepo() {
  try {
    childProcess.execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if there are changed and yet uncomitted files in the repository.
 * If yes, asks the user if they want to continue or abort and restart after commiting.
 *
 * @returns {boolean}
 */
function hasChangedFiles() {
  try {
    childProcess.execSync('git update-index --refresh', {
      stdio: 'ignore',
    });
    childProcess.execSync('git diff-index --quiet HEAD', {
      stdio: 'ignore',
    });
    return false;
  } catch {
    return true;
  }
}

/**
 * Aborts the process with a custom message and exit code.
 * @param {string=} customMessage
 * @param {number=} exitCode
 */
function abort(customMessage, exitCode = 0) {
  cancel(customMessage ?? 'Exiting, see you next time :)');
  process.exit(exitCode);
}

/**
 * Reads the package.json from the current working directory.
 * @param {string} cwd
 * @returns {Promise<import('types').PackageDotJson>}
 */
export async function getPackageDotJson(cwd) {
  const packageJsonFileContents = await fsPromises.readFile(path.join(cwd, 'package.json'), 'utf8').catch(() => {
    return undefined;
  });

  if (!packageJsonFileContents) {
    return {};
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return JSON.parse(packageJsonFileContents);
  } catch {
    return {};
  }
}

/**
 * Show a debug log message if the user has enabled debug mode.
 * @param {string} message
 * @param {boolean | undefined} show
 */
export function debugLog(message, show) {
  if (show) {
    log.info(`[Debug] ${message}`);
  }
}

/**
 * Show a debug error message if the user has enabled debug mode.
 * @param {string} message
 * @param {boolean | undefined} show
 */
export function debugError(message, show) {
  if (show) {
    log.error(`[Debug] ${message}`);
  }
}

/**
 *
 * @param {string} cwd
 * @param {import('types').PackageDotJson} packageJSON
 */
export async function maybeRunPrettier(cwd, packageJSON) {
  const hasPrettier = !!findInstalledPackageFromList(['prettier'], packageJSON);

  if (!hasPrettier) {
    return;
  }

  const packageManagerApi = getPackageManagerAPI(cwd);
  const baseCmd = detectPrettierCommand(packageJSON);
  const cmd = `${packageManagerApi.run} ${baseCmd}`;

  const runPrettier = await abortIfCancelled(
    confirm({
      message: `You have prettier installed. Do you want to run '${cmd}'?`,
      initialValue: true,
    })
  );

  if (runPrettier === true) {
    const s = spinner();
    s.start('Running prettier...');

    try {
      childProcess.execSync(cmd, {
        stdio: 'ignore',
        cwd,
      });
      s.stop('Prettier completed.');
    } catch (error) {
      s.stop('Prettier failed to complete.');
    }
  }
}

/**
 *
 * @param {import('types').PackageDotJson} packageJSON
 * @return {string}
 */
function detectPrettierCommand(packageJSON) {
  const scripts = packageJSON.scripts ?? {};

  const regex = /prettier(.*) --write/i;

  const prettierCmd = Object.keys(scripts).find(scriptName => {
    const cmd = scripts[scriptName];
    return cmd && regex.test(cmd);
  });

  if (prettierCmd) {
    return prettierCmd;
  }

  return `prettier --write "${JSCODESHIFT_EXTENSIONS}"`;
}
