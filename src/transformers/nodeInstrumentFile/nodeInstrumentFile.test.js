import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { fileExists, getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import tracingConfigTransformer from './index.js';

describe('transformers | nodeInstrumentFile', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(tracingConfigTransformer.name, 'Move @sentry/node config into instrument.js file');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assertStringEquals(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with browser SDK', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/browserApp'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assertStringEquals(
      actual1,
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/browserApp`, 'app.js')
    );
    assert.equal(fileExists(tmpDir, 'instrument.js'), false);
  });

  it('works with existing tracing.js', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppTracingFile'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    const actual2 = getDirFileContent(tmpDir, 'tracing.js');
    assertStringEquals(
      actual1,
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/nodeAppTracingFile`, 'app.js')
    );
    assertStringEquals(
      actual2,
      getDirFileContent(`${process.cwd()}/test-fixtures/nodeInstrumentFile/nodeAppTracingFile`, 'tracing.js')
    );
  });

  it('works with node SDK & simple import', async () => {
    tmpDir = makeTmpDir(getFixturePath('nodeInstrumentFile/nodeAppImport'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/node' });

    const actual1 = getDirFileContent(tmpDir, 'app.mjs');
    assertStringEquals(
      actual1,
      `import "./instrument";

// do something now!
console.log('Hello, World!');`
    );
    assert.equal(fileExists(tmpDir, 'instrument.mjs'), true);
    assertStringEquals(
      getDirFileContent(tmpDir, 'instrument.mjs'),
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
    assertStringEquals(
      actual1,
      `import "./instrument";
import { setTag } from '@sentry/node';
import { somethingElse } from 'other-package';

setTag('key', 'value');

// do something now!
console.log('Hello, World!', somethingElse.doThis());`
    );
    assert.equal(fileExists(tmpDir, 'instrument.js'), true);
    assertStringEquals(
      getDirFileContent(tmpDir, 'instrument.js'),
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
    assertStringEquals(
      actual1,
      `require("./instrument");

// do something now!
console.log('Hello, World!');`
    );
    assert.equal(fileExists(tmpDir, 'instrument.js'), true);
    assertStringEquals(
      getDirFileContent(tmpDir, 'instrument.js'),
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
    assertStringEquals(
      actual1,
      `require("./instrument");
const {
  setTag
} = require('@sentry/node');
const {
  somethingElse
} = require('other-package');

setTag('key', 'value');

// do something now!
console.log('Hello, World!', somethingElse.doThis());`
    );
    assert.equal(fileExists(tmpDir, 'instrument.js'), true);
    assertStringEquals(
      getDirFileContent(tmpDir, 'instrument.js'),
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
    assertStringEquals(
      actual1,
      `import "./instrument";

// do something now!
console.log('Hello, World!');`
    );
    assert.equal(fileExists(tmpDir, 'instrument.ts'), true);
    assertStringEquals(
      getDirFileContent(tmpDir, 'instrument.ts'),
      `import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: 'https://example.com' as string,
});`
    );
  });
});
