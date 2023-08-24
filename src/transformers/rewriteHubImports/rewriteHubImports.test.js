import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import rewriteHubImports from './index.js';

describe('transformers | rewriteHubImports', () => {
  let tmpDir = '';
  const latestVersion = execSync('npm show @sentry/browser version').toString().trim();

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(rewriteHubImports.name, 'Remove `@sentry/hub` imports');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await rewriteHubImports.transform([tmpDir], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('no-ops if no SDK is specified', async () => {
    tmpDir = makeTmpDir(getFixturePath('hubApp'));
    await rewriteHubImports.transform([`${tmpDir}/sdk-namespace-named.js`], { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, 'sdk-namespace-named.js');
    assert.equal(actual, getDirFileContent(`${process.cwd()}/test-fixtures/hubApp`, 'sdk-namespace-named.js'));
  });

  it('works with hub example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('hubApp'));
    await rewriteHubImports.transform([tmpDir], { sdk: '@sentry/browser', filePatterns: [], cwd: tmpDir });

    const sdkNamespaceNamedCode = getDirFileContent(tmpDir, 'sdk-namespace-named.js');
    const coreNamespaceNamedCode = getDirFileContent(tmpDir, 'core-namespace-named.js');
    const mixedNamespaceNamedCode = getDirFileContent(tmpDir, 'mixed-namespace-named.js');
    const mixedNamespaceNamedTypeScriptCode = getDirFileContent(tmpDir, 'mixed-namespace-named.ts');
    const mixedNamespaceNamespaceTypeScriptCode = getDirFileContent(tmpDir, 'mixed-namespace-namespace.ts');
    const mixedNamespaceNamespaceCJSCode = getDirFileContent(tmpDir, 'mixed-namespace-namespace.cjs');
    const packageJson = getDirFileContent(tmpDir, 'package.json');

    assertStringEquals(
      sdkNamespaceNamedCode,
      `import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const hub = new Sentry.Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
Sentry.makeMain(hub);`
    );

    assertStringEquals(
      coreNamespaceNamedCode,
      `import * as Sentry from '@sentry/browser';
import { makeSession, closeSession } from "@sentry/core";


Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

doSomethingExpensive();

closeSession(s);
`
    );

    assertStringEquals(
      mixedNamespaceNamedCode,
      `import * as Sentry from '@sentry/browser';
import { closeSession, makeSession } from "@sentry/core";

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

const hub = new Sentry.Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
Sentry.makeMain(hub);

closeSession(s);`
    );

    assertStringEquals(
      mixedNamespaceNamedTypeScriptCode,
      `import * as Sentry from '@sentry/browser';
import { closeSession, makeSession, Layer, Carrier } from "@sentry/core";

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = makeSession();

const hub = new Sentry.Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop: Layer = hub.getStackTop();
Sentry.makeMain(hub);

closeSession(s);`
    );

    assertStringEquals(
      mixedNamespaceNamespaceTypeScriptCode,
      `import * as Sentry from '@sentry/browser';
import * as Hub from "@sentry/core";

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = Hub.makeSession();

const hub = new Hub.Hub(Sentry.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop: Hub.Layer = hub.getStackTop();
Hub.makeMain(hub);

Hub.closeSession(s);`
    );

    assertStringEquals(
      mixedNamespaceNamespaceCJSCode,
      `const Sentry = require('@sentry/browser');
const Hub = require("@sentry/core");
const { makeMain } = require("@sentry/core");
const { closeSession } = require("@sentry/core");

Sentry.init({
  dsn: '__DSN__',
  tracesSampleRate: 1.0,
});

const s = Hub.makeSession();

const hub = new Hub.Hub(Hub.getCurrentHub().getClient(), Sentry.getCurrentHub().getScope());
const stackTop = hub.getStackTop();
makeMain(hub);

closeSession(s);`
    );

    assertStringEquals(
      packageJson,
      `{
  "dependencies": {
    "@sentry/core": "^${latestVersion}",
    "@sentry/hub": "~7.54.0",
    "@sentry/node": "~7.54.0"
  }
}`
    );
  });
});
