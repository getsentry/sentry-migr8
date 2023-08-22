import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import sdkLatestVersionTransformer from './index.js';

describe('transformers | sdkLatestVersion', () => {
  let tmpDir = '';
  const latestVersion = execSync('npm show @sentry/browser version').toString().trim();

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(sdkLatestVersionTransformer.name, 'Update SDK to latest version');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await sdkLatestVersionTransformer.transform([tmpDir], { filePatterns: [], cwd: tmpDir });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with no sentry deps files', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    await sdkLatestVersionTransformer.transform([tmpDir], { filePatterns: [], cwd: tmpDir });

    const actual = getDirFileContent(tmpDir, 'package.json');
    assertStringEquals(
      actual,
      `{
  "dependencies": {
    "webpack": "5.88.2"
  },
  "devDependencies": {
    "react": "latest"
  }
}`
    );
  });

  it('works with no deps', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/noDeps`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd });

    const actual = getDirFileContent(cwd, 'package.json');
    assertStringEquals(
      actual,
      `{
 "name": "no deps"
}`
    );
  });

  it('works with dependencies', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/dependencies`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd, sdk: '@sentry/react' });

    const actual = getDirFileContent(cwd, 'package.json');
    assertStringEquals(
      actual,
      `{
  "dependencies": {
    "@sentry/react": "^${latestVersion}",
    "react": "latest"
  },
  "devDependencies": {
    "webpack": "5.88.2"
  }
}`
    );
  });

  it('works with devDependencies', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/devDependencies`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd, sdk: '@sentry/react' });

    const actual = getDirFileContent(cwd, 'package.json');
    assertStringEquals(
      actual,
      `{
  "dependencies": {
    "webpack": "5.88.2"
  },
  "devDependencies": {
    "@sentry/react": "^${latestVersion}",
    "react": "latest"
  }
}`
    );
  });

  it('works with yarn', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/withYarn`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd, sdk: '@sentry/react' });

    const actual = getDirFileContent(cwd, 'package.json');
    assertStringEquals(
      actual,
      `{
  "dependencies": {
    "@sentry/react": "^${latestVersion}",
    "react": "latest"
  },
  "devDependencies": {
    "webpack": "5.88.2"
  }
}`
    );
  });

  it('works with pnpm', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/withPnpm`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd, sdk: '@sentry/react' });

    const actual = getDirFileContent(cwd, 'package.json');
    assertStringEquals(
      actual,
      `{
  "dependencies": {
    "@sentry/react": "~${latestVersion}",
    "react": "latest"
  },
  "devDependencies": {
    "webpack": "5.88.2"
  }
}`
    );
  });
});
