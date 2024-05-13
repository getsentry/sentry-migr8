import { describe, it, expect } from 'vitest';

import { getTransformers } from './getTransformers.js';

describe('getTransformers', () => {
  it('it finds transformers', async () => {
    const result = await getTransformers();

    // convert to vitest assertions
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(transformer => typeof transformer.name === 'string')).toBe(true);
    expect(result.every(transformer => typeof transformer.transform === 'function')).toBe(true);
  });
});
