import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import replayConfigTransformer from './index.js';

describe('transformers | replayConfig', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(replayConfigTransformer.name, 'Replay Config v7>v8');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await replayConfigTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    await replayConfigTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'myReactApp.js');
    const actual2 = getDirFileContent(tmpDir, 'myReactApp.ts');
    const actual3 = getDirFileContent(tmpDir, 'myReactApp.tsx');
    const actual4 = getDirFileContent(tmpDir, 'upToDateConfig.js');

    assertStringEquals(
      actual1,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      maskInputOptions: { email: true, text: false },
      other: "other",

      block: [
        '.existing-block',
        ".my-blocks-selector",
        "[my-block-attr]",
        ".my-block-class"
      ],

      ignore: [".my-ignore-class"],
      mask: [".my-mask-text-class", ".my-mask-text-selector", "[my-mask-text-attr]"]
    }),
  ],
});`
    );
    assertStringEquals(
      actual2,
      `import * as Sentry from '@sentry/react';

const Replay = Sentry.Replay as any;
const replay = new Replay({
  maskInputOptions: { email: true, text: false },
  block: [".my-blocks-selector", "[my-block-attr]", ".my-block-class"],
  ignore: [".my-ignore-class"],
  mask: [".my-mask-text-class", ".my-mask-text-selector", "[my-mask-text-attr]"]
});

Sentry.init({
  integrations: [replay],
});`
    );

    assertStringEquals(
      actual3,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      block: [".my-blocks-selector", "[my-block-attr]"]
    }),
  ],
});

function myTsx() {
  return (
    <div>
      <div className="my-blocks-selector" />
    </div>
  );
}`
    );

    assertStringEquals(
      actual4,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({
      block: ['.existing-block'],
      ignore: ['.my-ignore-class'],
      mask: ['.my-mask-class'],
      useCompression: true
    }),
  ],
});`
    );
  });
});
