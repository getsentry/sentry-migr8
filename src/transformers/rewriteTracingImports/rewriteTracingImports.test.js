import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import rewriteTracingImports from './index.js';

describe('transformers | rewriteTracingImports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(rewriteTracingImports.name).toEqual('Remove `@sentry/tracing` imports');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await rewriteTracingImports.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'app.js');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('no-ops if no SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingAppNodeEsm'));
    await rewriteTracingImports.transform([`${tmpDir}/named-named.mjs`], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'named-named.js');
    expect(actual).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/tracingAppNodeEsm`, 'named-named.js'));
  });

  it('works with Node ESM example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingAppNodeEsm'));
    await rewriteTracingImports.transform([tmpDir], { sdk: '@sentry/node', filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'named-named.js');
    const actual2 = getDirFileContent(tmpDir, 'named-named-2.mjs');
    const actual3 = getDirFileContent(tmpDir, 'namespace-named.mjs');
    const actual4 = getDirFileContent(tmpDir, 'namespace-named-2.mjs');
    const actual5 = getDirFileContent(tmpDir, 'namespace-namespace.ts');

    expect(actual1).toEqual(
      `import { init, addExtensionMethods } from '@sentry/node';

init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
`
    );

    expect(actual2).toEqual(
      `import { init as SentryInit, addExtensionMethods } from '@sentry/node';

SentryInit({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
`
    );

    expect(actual3).toEqual(
      `import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

Sentry.setTag('shouldBePrefixed', true);

Sentry.addExtensionMethods();

const transaction = Sentry.startTransaction({ name: 'test-transaction' });

Sentry.configureScope(scope => {
  scope.setSpan(transaction);
});

transaction.setTag('shouldBePrefixed', false)

doLongRunningThing();

transaction.finish();
`
    );

    expect(actual4).toEqual(
      `import * as Sentry from '@sentry/node';
import { addExtensionMethods as xyz } from "@sentry/node";

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

xyz();
`
    );

    expect(actual5).toEqual(
      `import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
} as Sentry.NodeOptions);

Sentry.addExtensionMethods();

let txn: Sentry.Transaction | undefined;
txn = Sentry.startTransaction({
  name: 'test',
});

txn.finish();

function dontTouchThis() {
  const Tracing = 'foo';
  console.log(Tracing);
}
`
    );
  });

  it('works with Node CJS example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingAppNodeCjs'));
    await rewriteTracingImports.transform([tmpDir], { sdk: '@sentry/node', filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'named-named.cjs');
    const actual2 = getDirFileContent(tmpDir, 'named-named-2.cjs');
    const actual3 = getDirFileContent(tmpDir, 'namespace-named.js');
    const actual4 = getDirFileContent(tmpDir, 'namespace-named-2.js');
    const actual5 = getDirFileContent(tmpDir, 'namespace-namespace.js');

    expect(actual1).toEqual(
      `const { init } = require('@sentry/node');
const { addExtensionMethods } = require("@sentry/node");

init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
`
    );

    expect(actual2).toEqual(
      `const { init: SentryInit } = require('@sentry/node');
const { addExtensionMethods } = require("@sentry/node");

SentryInit({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
`
    );

    expect(actual3).toEqual(
      `const Sentry = require('@sentry/node');
const { addExtensionMethods } = require("@sentry/node");

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

addExtensionMethods();
`
    );

    expect(actual4).toEqual(
      `const Sentry = require('@sentry/node');
const { addExtensionMethods: xyz } = require("@sentry/node");

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

xyz();
`
    );

    expect(actual5).toEqual(
      `const Sentry = require('@sentry/node');
const Tracing = require("@sentry/node");

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

Tracing.addExtensionMethods();

let txn;
txn = Sentry.startTransaction({
  name: 'test',
});

txn.finish();

function dontTouchThis() {
  const Tracing = 'foo';
  console.log(Tracing);
}
`
    );
  });

  it('works with Browser example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('tracingAppBrowser'));
    await rewriteTracingImports.transform([tmpDir], { sdk: '@sentry/browser', filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'esm-namespace-named.js');

    expect(actual1).toEqual(
      `import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
  integrations: [new Sentry.BrowserTracing()],
});

Sentry.addExtensionMethods();

console.log(Sentry.TRACEPARENT_REGEXP)
`
    );
  });
});
