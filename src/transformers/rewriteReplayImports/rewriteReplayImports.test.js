import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

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
    expect(rewriteReplayImports.name, 'Remove `@sentry/replay` imports');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await rewriteReplayImports.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'app.js');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('no-ops if no SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/oldReplayImport.js`], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'oldReplayImport.js');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'oldReplayImport.js'));
  });

  it('no-ops if server SDKs are specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/oldReplayImport.js`], { filePatterns: [], sdk: '@sentry/node' });

    const actual = getDirFileContent(tmpDir, 'oldReplayImport.js');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'oldReplayImport.js'));
  });

  it('no-ops if Replay is already imported from the SDK package', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([`${tmpDir}/myReactApp.tsx`], { filePatterns: [], sdk: '@sentry/react' });

    const actual = getDirFileContent(tmpDir, 'myReactApp.tsx');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/replayApp`, 'myReactApp.tsx'));
  });

  it('works with Replay example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await rewriteReplayImports.transform([tmpDir], { sdk: '@sentry/react', filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'oldReplayImport.js');
    const actual2 = getDirFileContent(tmpDir, 'oldReplayNamespaceImport.js');

    expect(actual1).toEqual(
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
`
    );

    expect(actual2).toEqual(
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      sessionSampleRate: 0.1,
      errorSampleRate: 0.75,
    }),
  ],
});
`
    );
  });
});
