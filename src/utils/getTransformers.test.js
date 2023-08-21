import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import { getTransformers } from './getTransformers.js';

describe('getTransformers', () => {
  it('it finds transformers', async () => {
    const result = await getTransformers();

    assert.ok(Array.isArray(result), 'result is an array');
    assert.ok(result.length > 0, 'result is not empty');
    assert.ok(
      result.every(transformer => typeof transformer.name === 'string'),
      'transformers have a name'
    );
    assert.ok(
      result.every(transformer => typeof transformer.transform === 'function'),
      'transformers have a transform function'
    );
  });
});
