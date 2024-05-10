import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

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
    expect(convertEnumsTransformer.name).toEqual('Convert Enums to String Literals');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await convertEnumsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImports.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import { other } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function doSomething() {
  const a = "fatal";
  const b = "unknown_error";
  const c = "debug";
  const d = "failed_precondition";
  const x = other();
}
`
    );
  });

  it('works with typescript', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImports.ts';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
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
}
`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withRequire.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
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
}
`
    );
  });

  it('works with imports & unknown exnums', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withImportsAndUnknownEnum.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `import { Severity, other, SpanStatus } from '@sentry/browser';

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

  it('works with require & unknown exnums', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withRequireAndUnknownEnum.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `const { Severity, other, SpanStatus } = require('@sentry/browser');

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

  it('works with a single require', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withSingleRequire.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `function doSomething() {
  const a = "fatal";
}
`
    );
  });

  it('works with a single import', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'withSingleImport.js';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `function doSomething() {
  const a = "fatal";
}

`
    );
  });

  it('works with .vue file', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'vueFile.vue';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `<script setup>
import { ref } from 'vue'
import * as Sentry from '@sentry/vue'

defineProps({
  msg: String
})

console.log("info")
console.log("info")

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      This is a very simple test app.
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite
    starter
  </p>
  <p>
    Install
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
    in your IDE for a better DX
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
`
    );
  });

  it('works with .svelte file', async () => {
    tmpDir = makeTmpDir(getFixturePath('enumsApp'));
    const file = 'svelteFile.svelte';
    const files = [`${tmpDir}/${file}`];
    await convertEnumsTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    expect(actual).toEqual(
      `<script lang="ts">
  import { browser } from '$app/environment';
  import TextLink from '$lib/components/text-link.svelte';
  export let company: string;
  export let position: string;
  export let url: string | undefined = undefined;
  export let timeFrame: string | undefined = undefined;
  export let location: string | undefined = undefined;
  import * as Sentry from '@sentry/svelte';
  import { onDestroy } from 'svelte';
  if (browser) {
    Sentry.setTag('component', 'Test');
    onDestroy(() => {
      Sentry.setTag('component', undefined);
    });
    const currentSpan = Sentry.getActiveTransaction();
    currentSpan?.setStatus("ok" || "ok");
  }
</script>
<div class="flex flex-col w-full">
  {#if url}
    <h3>
      <TextLink href={url}><span class="font-bold text-lg">{company}</span></TextLink>
    </h3>
  {:else}
    <h3><span class="font-bold text-lg">{company}</span></h3>
  {/if}
  <span class="whitespace-nowrap">{position}</span>
  {#if timeFrame}
    <span class="whitespace-nowrap text-xs">{timeFrame}</span>
  {/if}
  {#if location}
    <span class="whitespace-nowrap text-xs">{location}</span>
  {/if}
</div>
`
    );
  });
});
