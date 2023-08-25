import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import rewriteSvelteConfig from './index.js';

describe('transformers | rewriteSvelteConfig', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(rewriteSvelteConfig.name, 'Rewrite Svelte Config');
  });

  it('no-ops with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await rewriteSvelteConfig.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('no-ops if no SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppNamed'));
    await rewriteSvelteConfig.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/svelteAppNamed`, 'svelte.config.js'));
  });

  it('no-ops if a non-Svelte SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppNamed'));
    await rewriteSvelteConfig.transform([tmpDir], { filePatterns: [], sdk: '@sentry/react' });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/svelteAppNamed`, 'svelte.config.js'));
  });

  it('no-ops if `componentTrackingPreprocessor` is not used in the file', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppUnchanged'));
    await rewriteSvelteConfig.transform([tmpDir], { filePatterns: [], sdk: '@sentry/svelte' });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/svelteAppUnchanged`, 'svelte.config.js'));
  });

  it('works with a svelte config with named imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppNamed'));
    await rewriteSvelteConfig.transform([`${tmpDir}/svelte.config.js`], { filePatterns: [], sdk: '@sentry/svelte' });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');

    assertStringEquals(
      actual,
      `import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import { withSentryConfig } from "@sentry/svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [preprocess({ postcss: true }), mdsvex({
    extensions: ['.md']
  })],

  extensions: ['.svelte', '.md'],

  kit: {
    adapter: adapter(),
    files: {
      lib: './src/lib'
    }
  },

  vitePlugin: {
    inspector: true
  }
};

export default withSentryConfig(config);`
    );
  });

  it('works with a svelte config with a namespace Sentry import', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppNamespace'));
    await rewriteSvelteConfig.transform([`${tmpDir}/svelte.config.js`], { filePatterns: [], sdk: '@sentry/sveltekit' });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');

    assertStringEquals(
      actual,
      `import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import * as Sentry from '@sentry/sveltekit';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [preprocess({ postcss: true }), mdsvex({
    extensions: ['.md']
  })],

  extensions: ['.svelte', '.md'],

  kit: {
    adapter: adapter(),
    files: {
      lib: './src/lib'
    }
  },

  vitePlugin: {
    inspector: true
  }
};

export default Sentry.withSentryConfig(config);`
    );
  });

  it('only removes the preprocessor if the wrapper is already applied', async () => {
    tmpDir = makeTmpDir(getFixturePath('svelteAppOnlyRemove'));
    await rewriteSvelteConfig.transform([`${tmpDir}/svelte.config.js`], { filePatterns: [], sdk: '@sentry/svelte' });

    const actual = getDirFileContent(tmpDir, 'svelte.config.js');

    assertStringEquals(
      actual,
      `import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex';
import * as Sentry from '@sentry/svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [preprocess({ postcss: true }), mdsvex({
    extensions: ['.md']
  })],

  extensions: ['.svelte', '.md'],

  kit: {
    adapter: adapter(),
    files: {
      lib: './src/lib'
    }
  },

  vitePlugin: {
    inspector: true
  }
};

export default Sentry.withSentryConfig(config);`
    );
  });
});
