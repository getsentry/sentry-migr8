import { cancel, isCancel, outro } from '@clack/prompts';

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
