import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import tracingConfigTransformer from './index.js';

describe('transformers | tracingConfig', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(tracingConfigTransformer.name).toEqual('Tracing Config v7>v8');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withImports.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with tracingOrigins', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withTracingOrigins.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import * as Sentry from '@sentry/react';

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with http', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withHttp.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.Http({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with undici', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withUndici.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const Sentry = require('@sentry/react');

Sentry.init({
  integrations: [
    new Sentry.Replay({}),
    new Sentry.Undici({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with specific imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withSpecificImports.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import {init, Replay, BrowserTracing} from '@sentry/react';

init({
  integrations: [
    new Replay({}),
    new BrowserTracing({})
  ],

  tracePropagationTargets: ['asdas', /regex/gmi]
});
`
    );
  });

  it('works with specific existing tracePropagationTargets', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingConfig'));
    const file = 'withExistingTracePropagationTargets.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import * as Sentry from '@sentry/react';

Sentry.init({
  tracePropagationTargets: ['existing', /other/gmi],
  integrations: [
    new Sentry.Replay({}),
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['asdas', /regex/gmi]
    })
  ],
});
`
    );
  });
});
