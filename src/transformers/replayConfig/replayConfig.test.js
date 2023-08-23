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

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'myReactApp.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
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

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.75
});`
    );
  });

  it('works with typescript', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'myReactApp.ts';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
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
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.75
});`
    );
  });

  it('works with tsx', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'myReactApp.tsx';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
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
  });

  it('works with up to date config', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'upToDateConfig.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
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

  it('works with old sample rates', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'oldSampleRates.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
  ],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.75
});`
    );
  });

  it('works with old sample rates in separate file', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'oldSampleRatesSeparateFile.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/react';

const replay = new Sentry.Replay({
  sessionSampleRate: 0.1,
  errorSampleRate: 0.75,
  block: [".my-block-class"]
});`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `const Sentry = require('@sentry/react');

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

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.75
});`
    );
  });

  it('works with specific imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('replayApp'));
    const file = 'specificImports.js';
    const files = [`${tmpDir}/${file}`];
    await replayConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import {init, Replay} from '@sentry/react';

init({
  integrations: [
    new Replay({
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

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.75
});`
    );
  });
});
