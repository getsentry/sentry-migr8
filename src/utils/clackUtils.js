import * as childProcess from 'child_process';

import { cancel, isCancel, confirm } from '@clack/prompts';

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
 * Checks if the user is inside a git repository.
 * If not, it asks the user if they want to continue, otherwise we're fine.
 *
 * @returns {Promise<void>}
 */
export async function confirmContinueEvenThoughNoGitRepo() {
  try {
    childProcess.execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
    });
  } catch {
    const continueWithoutGit = await abortIfCancelled(
      confirm({
        message:
          'You are not inside a git repository. Migr8 will modify and update some of your files. Do you still want to continue?',
      })
    );

    if (!continueWithoutGit) {
      abort(undefined);
    }
  }
}

/**
 * Aborts the process with a custom message and exit code.
 * @param {string | undefined} customMessage
 * @param {number} exitCode
 */
function abort(customMessage, exitCode = 0) {
  cancel(customMessage ?? 'Exiting, see you next time :)');
  process.exit(exitCode);
}
