import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

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
    assert.equal(tracingConfigTransformer.name, 'Add migration comments');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await tracingConfigTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with startTransaction', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'startTransaction.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/browser';
import { startTransaction } from '@sentry/browser';

function doSomething() {
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  startTransaction();
}

function doSomethingElse() {
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  const transaction = Sentry.startTransaction();
  transaction.finish();

  const obj = {
    // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
    transaction: Sentry.startTransaction(),
  };
}`
    );
  });

  it('works with TS', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'noFalsePositives.ts';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `function indexMembersByProject(members: Member[]): IndexedMembersByProject {
  return members.reduce<IndexedMembersByProject>((acc, member) => {
    for (const project of member.projects) {
      if (!acc.hasOwnProperty(project)) {
        acc[project] = [];
      }
      if (member.user) {
        acc[project].push(member.user);
      }
    }
    return acc;
  }, {});
}`
    );
  });

  it('works with span.startChild', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'startChild.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `function doSomething(span) {
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  span.startChild();
}

function doSomethingElse() {
  const transaction = Sentry.getActiveSpan();
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  transaction.startChild().end();
  transaction.finish();
}`
    );
  });

  it('works with hub', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'hub.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/browser';
import { makeMain, Hub } from '@sentry/browser';

// TODO(sentry): Use \`new Scope()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md
const hub = new Hub();
// TODO(sentry): Use \`setCurrentClient()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md
makeMain(hub);

function doSomethingElse() {
  // TODO(sentry): Use \`new Scope()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md
  const hub = new Sentry.Hub();
  // TODO(sentry): Use \`setCurrentClient()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-initializing.md
  Sentry.makeMain(hub);
}
`
    );
  });

  it('works with getActiveTransaction', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'getActiveTransaction.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/browser';
import { getActiveTransaction } from '@sentry/browser';

function doSomething() {
  // TODO(sentry): Use \`getActiveSpan()\` instead. If you use this only to start a child, use \`startInactiveSpan({ onlyIfParent: true })\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  getActiveTransaction();
}

function doSomethingElse() {
  // TODO(sentry): Use \`getActiveSpan()\` instead. If you use this only to start a child, use \`startInactiveSpan({ onlyIfParent: true })\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  const transaction = Sentry.getActiveTransaction();
  transaction.finish();

  const obj = {
    // TODO(sentry): Use \`getActiveSpan()\` instead. If you use this only to start a child, use \`startInactiveSpan({ onlyIfParent: true })\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
    transaction: Sentry.getActiveTransaction(),
  };
}`
    );
  });

  it('avoids adding duplicate comments', async () => {
    tmpDir = makeTmpDir(getFixturePath('addMigrationComments'));
    const file = 'existingComments.js';
    const files = [`${tmpDir}/${file}`];
    await tracingConfigTransformer.transform(files, { filePatterns: [] });

    const actual = getDirFileContent(tmpDir, file);

    assertStringEquals(
      actual,
      `import * as Sentry from '@sentry/browser';
import { startTransaction } from '@sentry/browser';

function doSomething() {
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  startTransaction();
}

function doSomethingElse() {
  // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
  const transaction = Sentry.startTransaction();
  transaction.finish();

  const obj = {
    // TODO(sentry): Use \`startInactiveSpan()\` instead - see https://github.com/getsentry/sentry-javascript/blob/develop/docs/v8-new-performance-apis.md
    transaction: Sentry.startTransaction(),
  };
}`
    );
  });
});
