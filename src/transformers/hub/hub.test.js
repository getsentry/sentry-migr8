import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import transformer from './index.js';

describe('transformers | hub', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(transformer.name, 'Migrate Hub usage');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await transformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'withImports.js');

    expect(withImports).toEqual(
      `import {
  captureException,
  setUser,
  getClient,
  getCurrentScope,
  getIsolationScope,
  captureSession,
  startSession,
  endSession,
  withScope,
  setExtra,
  setContext,
  getIntegration,
  captureEvent,
} from '@sentry/browser';

function doSomething() {
  captureException(error);
  setUser({ name: 'Anne' });
  const client = getClient();
  const scope = getCurrentScope();
  const isolationScope = getIsolationScope();
  captureSession({});
  startSession();
  endSession();
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().run(() => {
    // do something
  });
  withScope(scope => {
    // do something
  });
  setExtra({});
  setContext({});
  const integration = getIntegration('MyIntegration');

  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().bindClient(client);
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  const scope2 = getCurrentHub().pushScope();
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().popScope();
}

function doSomethingElse() {
  const hub = getCurrentHub();
  const otherHubHere = getCurrentHub();

  setExtra({});
  captureEvent({});
}
`
    );
  });

  it('works with require', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const actual = getDirFileContent(tmpDir, 'withRequire.js');

    expect(actual).toEqual(
      `const {
  captureException,
  setUser,
  getClient,
  getCurrentScope,
  getIsolationScope,
  captureSession,
  startSession,
  endSession,
  withScope,
  setExtra,
  setContext,
  getIntegration,
  captureEvent
} = require('@sentry/browser');

function doSomething() {
  captureException(error);
  setUser({ name: 'Anne' });
  const client = getClient();
  const scope = getCurrentScope();
  const isolationScope = getIsolationScope();
  captureSession({});
  startSession();
  endSession();
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().run(() => {
    // do something
  });
  withScope(scope => {
    // do something
  });
  setExtra({});
  setContext({});
  const integration = getIntegration('MyIntegration');

  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().bindClient(client);
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  const scope2 = getCurrentHub().pushScope();
  // TODO(sentry): Could not automatically migrate - see https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md#deprecate-hub
  getCurrentHub().popScope();
}

function doSomethingElse() {
  const hub = getCurrentHub();
  const otherHubHere = getCurrentHub();

  setExtra({});
  captureEvent({});
}
`
    );
  });

  it('works with merged imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'mergeImports.js');

    expect(withImports).toEqual(
      `import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.captureException(error);
  Sentry.setUser({ name: 'Anne' });
}
`
    );
  });

  it('works with merged requires', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'mergeRequire.js');

    expect(withImports).toEqual(
      `const { captureException } = require('@sentry/browser');
const Sentry = require('@sentry/browser');

function doSomething() {
  captureException(error);
  Sentry.setUser({ name: 'Anne' });
}
`
    );
  });

  it('works with namespace imports', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'namespaceImport.js');

    expect(withImports).toEqual(
      `import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.captureException(error);
  Sentry.setUser({ name: 'Anne' });
}
`
    );
  });

  it('works with namespace requires', async () => {
    tmpDir = makeTmpDir(getFixturePath('hub'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'namespaceRequire.js');

    expect(withImports).toEqual(
      `const Sentry = require('@sentry/browser');

function doSomething() {
  Sentry.captureException(error);
  Sentry.setUser({ name: 'Anne' });
}
`
    );
  });
});
