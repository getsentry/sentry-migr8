import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import rewriteReplayImports from './index.js';

describe('transformers | rewriteReplayImports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(rewriteReplayImports.name, 'Remove `@sentry/replay` imports');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await rewriteReplayImports.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('no-ops if no SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/oldReplayImport.js`], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'oldReplayImport.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'oldReplayImport.js'));
  });

  it('no-ops if server SDKs are specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/oldReplayImport.js`], { filePatterns: [], sdk: '@sentry/node' });

    const actual = getDirFileContent(tmpDir, 'oldReplayImport.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'oldReplayImport.js'));
  });

  it('no-ops if Replay is already imported from the SDK package', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/myReactApp.tsx`], { filePatterns: [], sdk: '@sentry/react' });

    const actual = getDirFileContent(tmpDir, 'myReactApp.tsx');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'myReactApp.tsx'));
  });

  it('works with Replay example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([tmpDir], { sdk: '@sentry/react', filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'oldReplayImport.js');
    const actual2 = getDirFileContent(tmpDir, 'oldReplayNamespaceImport.js');

    assertStringEquals(
      actual1,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});`
    );

    assertStringEquals(
      actual2,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});`
    );
  });
});
