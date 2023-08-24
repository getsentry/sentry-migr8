import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import convertEnumsTransformer from './index.js';

describe('transformers | utilExports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(convertEnumsTransformer.name, 'Convert Enums to String Literals');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await convertEnumsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImports.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import { other } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = "debug";
  const d = "failed_precondition";
  const x = other();
}`
    );
  });

  it('works with typescript', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImports.ts';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import { other } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = "debug";
  const d = "failed_precondition";
  const x = other();
}

enum SpanStatus {
  Fatal = 'fatal',
  UnknownError = 'unknown_error',
}`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `const {
  other
} = require('@sentry/browser');
const Sentry =  require('sentry/browser');

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = "debug";
  const d = "failed_precondition";
  const x = other();
}`
    );
  });

  it('works with imports & unknown exnums', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImportsAndUnknownEnum.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import { Severity, other, SpanStatus } from '@sentry/browser';

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = Severity.ThisDoesNotExist;
  const d = SpanStatus.ThisDoesNotExist;
  const x = other();
}`
    );
  });

  it('works with require & unknown exnums', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withRequireAndUnknownEnum.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      ` const { Severity, other, SpanStatus } = require('@sentry/browser');

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = Severity.ThisDoesNotExist;
  const d = SpanStatus.ThisDoesNotExist;
  const x = other();
}
`
    );
  });
});
