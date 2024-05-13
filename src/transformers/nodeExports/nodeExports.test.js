import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import nodeExportsTransformer from './index.js';

describe('transformers | nodeExports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(nodeExportsTransformer.name).toEqual('Node Handler Utils v7>v8');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await nodeExportsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeApp'));
    const file = 'withImports.js';
    const files = [`${tmpDir}/${file}`];
    await nodeExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import {other, myOtherImport, extractRequestData} from '@sentry/node';
import * as Sentry from '@sentry/node';

extractRequestData();
Sentry.extractRequestData();
other.extractRequestData();
myOtherImport();
`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeApp'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await nodeExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const { other, myOtherImport, extractRequestData } = require('@sentry/node');
const Sentry = require('@sentry/node');

extractRequestData();
Sentry.extractRequestData();
other.extractRequestData();
myOtherImport();

`
    );
  });

  it('handles other functions on Handlers for import', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeApp'));
    const file = 'withOtherHandlerFunctions.js';
    const files = [`${tmpDir}/${file}`];
    await nodeExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import { Handlers, other, extractRequestData } from '@sentry/node';

extractRequestData();
Handlers.tracingHandler();
other.extractRequestData();

`
    );
  });

  it('handles other functions on Handlers for require', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeApp'));
    const file = 'withRequireAndOtherHandlerFunctions.js';
    const files = [`${tmpDir}/${file}`];
    await nodeExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const {
  Handlers,
  other,
  extractRequestData
} = require('@sentry/node');

extractRequestData();
Handlers.tracingHandler();
other.extractRequestData();
`
    );
  });

  it('handles types', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeApp'));
    const file = 'withTypeImports.ts';
    const files = [`${tmpDir}/${file}`];
    await nodeExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import { Handlers, PolymorphicRequest } from '@sentry/node';
import * as Sentry from '@sentry/node';

export function doSomething(input: PolymorphicRequest): Sentry.PolymorphicRequest {
  Handlers.doSomethingElse();
  return {} as PolymorphicRequest;
}
`
    );
  });
});
