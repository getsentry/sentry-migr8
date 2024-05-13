import { rmSync } from 'node:fs';
import { beforeEach } from 'node:test';

import { afterEach, describe, it, expect, vi } from 'vitest';

import { fileExists, getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import tracingConfigTransformer from './index.js';

/** @type typeof globalThis & { _clackSelectResponse?: unknown } */
const globalWithClackMock = global;

vi.mock('@clack/prompts', async () => {
  return {
    // ...(await importOriginal<typeof import('@clack/prompts')>() ?? {}),
    // this will only affect "foo" outside of the original module
    select: vi.fn(async () => globalWithClackMock._clackSelectResponse ?? true),
    confirm: vi.fn(async () => true),
    log: {
      info: vi.fn(),
      warn: vi.fn(),
    },
    isCancel: vi.fn(() => false),
  };
});

describe('transformers | nodeInstrumentFile', () => {
  let tmpDir = '';

  beforeEach(() => {
    vi.clearAllMocks();
    globalWithClackMock._clackSelectResponse = undefined;
  });

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(tracingConfigTransformer.name).toEqual('Move @sentry/node config into instrument.js file');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with browser SDK', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/browserApp'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/browserApp`, 'app.js')
    );
    expect(fileExists(tmpDir, 'instrument.js')).toBe(false);
  });

  it('works with existing tracing.js', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppTracingFile'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    const actual2 = getDirFileContent(tmpDir, 'tracing.js');
    expect(actual1).toEqual(
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/nodeAppTracingFile`, 'app.js')
    );
    expect(actual2).toEqual(
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/nodeAppTracingFile`, 'tracing.js')
    );
  });

  it('works with node SDK & simple import', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppImport'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.mjs');
    expect(actual1).toEqual(
      `import "./instrument";

// do something now!
console.log('Hello, World!');
`
    );
    expect(fileExists(tmpDir, 'instrument.mjs')).toBe(true);
    expect(getDirFileContent(tmpDir, 'instrument.mjs')).toEqual(
      `import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://example.com',
});`
    );
  });

  it('works with node SDK & other imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppImports'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(
      `import "./instrument";
import { setTag } from '@sentry/node';
import { somethingElse } from 'other-package';

setTag('key', 'value');

// do something now!
console.log('Hello, World!', somethingElse.doThis());
`
    );
    expect(fileExists(tmpDir, 'instrument.js')).toBe(true);
    expect(getDirFileContent(tmpDir, 'instrument.js')).toEqual(
      `import { init, getActiveSpan } from '@sentry/node';
import { something } from 'other-package';
init({
  dsn: 'https://example.com',
  beforeSend(event) {
    event.extra.hasSpan = !!getActiveSpan();
    event.extra.check = something();
    return event;
  }
});`
    );
  });

  it('works with node SDK & simple require', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppRequire'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(
      `require("./instrument");

// do something now!
console.log('Hello, World!');
`
    );
    expect(fileExists(tmpDir, 'instrument.js')).toBe(true);
    expect(getDirFileContent(tmpDir, 'instrument.js')).toEqual(
      `const Sentry = require('@sentry/node');
Sentry.init({
  dsn: 'https://example.com',
});`
    );
  });

  it('works with node SDK & other requires', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppRequires'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(
      `require("./instrument");
const {
  setTag
} = require('@sentry/node');
const {
  somethingElse
} = require('other-package');

setTag('key', 'value');

// do something now!
console.log('Hello, World!', somethingElse.doThis());
`
    );
    expect(fileExists(tmpDir, 'instrument.js')).toBe(true);
    expect(getDirFileContent(tmpDir, 'instrument.js')).toEqual(
      `const {
  init,
  getActiveSpan
} = require('@sentry/node');
const {
  something
} = require('other-package');
init({
  dsn: 'https://example.com',
  beforeSend(event) {
    event.extra.hasSpan = !!getActiveSpan();
    event.extra.check = something();
    return event;
  }
});`
    );
  });

  it('works with node SDK & typescript', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppTypescript'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.ts');
    expect(actual1).toEqual(
      `import "./instrument";

// do something now!
console.log('Hello, World!');
`
    );
    expect(fileExists(tmpDir, 'instrument.ts')).toBe(true);
    expect(getDirFileContent(tmpDir, 'instrument.ts')).toEqual(
      `import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://example.com' as string,
});`
    );
  });
});
