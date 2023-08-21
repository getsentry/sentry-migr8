import { describe, it } from 'node:test';

import { KEYS, WaitType, defaultRunner } from '../test-helpers/clet.js';

describe('index', () => {
  it('works with an empty app & default options', async () => {
    await defaultRunner('emptyApp')
      .wait(WaitType.stdout, /Do you want to apply all transformers, or only selected ones/)
      .wait(WaitType.stdout, /Do you want to apply all transformers, or only selected ones/)
      .stdin(/Do you want to apply all transformers, or only selected ones/, KEYS.ENTER)
      .wait(WaitType.stdout, /Applying 1 transformer\(s\).../)
      .wait(WaitType.stdout, /Transformer Example transformer completed./)
      .wait(WaitType.stdout, /All transformers completed!/);
  });
});
