import { describe, it } from 'node:test';

import { KEYS, WaitType, defaultRunner } from '../test-helpers/clet.js';

describe('index', () => {
  it('works with an empty app & default options', async () => {
    await defaultRunner('emptyApp')
      .wait(WaitType.stdout, /Do you want to apply all transformers, or only selected ones/)
      .stdin(/Do you want to apply all transformers, or only selected ones/, KEYS.ENTER)
      .wait(WaitType.stdout, /Transformer (.*) completed./)
      .wait(WaitType.stdout, /All transformers completed!/);
  });
});
