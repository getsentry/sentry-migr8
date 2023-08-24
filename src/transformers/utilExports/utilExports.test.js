import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import utilExportsTransformer from './index.js';

describe('transformers | utilExports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(utilExportsTransformer.name, 'Util Exports v7>v8');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await utilExportsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('utilsApp'));
    const file = 'withImports.js';
    const files = [`${tmpDir}/${file}`];
    await utilExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import { severityLevelFromString, GLOBAL_OBJ, timestampInSeconds } from '@sentry/utils';
import * as SentryUtils from '@sentry/utils';

function doSomething() {
  const a = severityLevelFromString('warning');
  const b = GLOBAL_OBJ;
  const c = GLOBAL_OBJ;
  const d = timestampInSeconds + 1000;
  const e = SentryUtils.timestampInSeconds + 1000;
}`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('utilsApp'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await utilExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `const { severityLevelFromString, GLOBAL_OBJ, timestampInSeconds } = require('@sentry/utils');
const SentryUtils = require('@sentry/utils');

function doSomething() {
  const a = severityLevelFromString('warning');
  const b = GLOBAL_OBJ;
  const c = GLOBAL_OBJ;
  const d = timestampInSeconds + 1000;
  const e = SentryUtils.timestampInSeconds + 1000;
}`
    );
  });

  it('deduplicates imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('utilsApp'));
    const file = 'withExistingImports.js';
    const files = [`${tmpDir}/${file}`];
    await utilExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import { severityLevelFromString, other } from '@sentry/utils';

function doSomething() {
  const a = severityLevelFromString('warning');
  const b = severityLevelFromString('warning');
  const c = other();
}`
    );
  });

  it('deduplicates requires', async () => {
    tmpDir = makeTmpDir(getFixturePath('utilsApp'));
    const file = 'withExistingRequire.js';
    const files = [`${tmpDir}/${file}`];
    await utilExportsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `const {
  severityLevelFromString,
  other
} = require('@sentry/utils');

function doSomething() {
  const a = severityLevelFromString('warning');
  const b = severityLevelFromString();
  const c = other();
}`
    );
  });
});
