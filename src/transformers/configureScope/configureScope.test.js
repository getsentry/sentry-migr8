import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import configureScopeTransformer from './index.js';

describe('transformers | configureScope', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(configureScopeTransformer.name, 'Use getCurrentScope() instead of configureScope()');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await configureScopeTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('configureScope'));
    await configureScopeTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'withImports.js');
    const withImportsTs = getDirFileContent(tmpDir, 'withImports.ts');
    const withRequire = getDirFileContent(tmpDir, 'withRequire.js');
    const onHub = getDirFileContent(tmpDir, 'onHub.js');

    assertStringEquals(
      withImports,
      `import { getCurrentScope } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function orig() {
  // do something
}

function doSomething() {
  getCurrentScope().setTag('aaa', 'aaa');
  Sentry.getCurrentScope().setTag('ccc', 'ccc');

  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  configureScope(orig);

  {
    const scope = Sentry.getCurrentScope();
    scope.setTag('ccc', 'ccc');
    scope.setExtra('ddd', { ddd: 'ddd' });
  };

  getCurrentScope().addAttachment({ filename: 'scope.file', data: 'great content!' });
  Sentry.getCurrentScope().addAttachment({ filename: 'scope.file', data: 'great content!' });
}`
    );

    assertStringEquals(
      withImportsTs,
      `import { getCurrentScope } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function orig(): void {
  // do something
}

function doSomething(): void {
  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  configureScope(orig);

  {
    const scope = Sentry.getCurrentScope();
    scope.setTag('ccc', 'ccc');
    scope.setExtra('ddd', { ddd: 'ddd' });
  };
}
`
    );

    assertStringEquals(
      withRequire,
      `const { getCurrentScope } = require('@sentry/browser');
const Sentry = require('@sentry/browser');

function orig() {
  // do something
}

function doSomething() {
  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  {
    const scope = getCurrentScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  configureScope(orig);

  {
    const scope = Sentry.getCurrentScope();
    scope.setTag('ccc', 'ccc');
    scope.setExtra('ddd', { ddd: 'ddd' });
  };
}`
    );

    assertStringEquals(
      onHub,
      `import { getCurrentHub } from '@sentry/browser';
import * as Sentry from '@sentry/browser';

function orig() {
  // do something
}

function doSomething() {
  {
    const scope = Sentry.getCurrentHub().getScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  {
    const scope = getCurrentHub().getScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  const hub = Sentry.getCurrentHub();
  {
    const scope = hub.getScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };

  const currentHub = Sentry.getCurrentHub();
  {
    const scope = currentHub.getScope();
    scope.setTag('aaa', 'aaa');
    scope.setExtra('bbb', { bbb: 'bbb' });
  };
}`
    );
  });
});
