import { rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import sdkLatestVersionTransformer from './index.js';

describe('transformers | sdkLatestVersion', () => {
  let tmpDir = '';
  // hub was discontinued in v8; so getting the latest version gives us the latest v7 version cheaply.
  const latestV7Version = execSync('npm show @sentry/hub version').toString().trim();
  const latestVersion = execSync('npm show @sentry/browser version').toString().trim();

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(sdkLatestVersionTransformer.name).toEqual('Update SDK to latest version');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await sdkLatestVersionTransformer.transform([tmpDir], { filePatterns: [], cwd: tmpDir });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with no sentry deps files', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    await sdkLatestVersionTransformer.transform([tmpDir], { filePatterns: [], cwd: tmpDir });

    const actual = getDirFileContent(tmpDir, 'package.json');
    expect(actual).toEqual(
      `{
  "dependencies": {
    "is-even": "1.0.0"
  },
  "devDependencies": {
    "is-odd": "3.0.1"
  }
}
`
    );
  });

  it('works with no deps', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/noDeps`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd });

    const actual = getDirFileContent(cwd, 'package.json');
    expect(actual).toEqual(
      `{
 "name": "no deps"
}
`
    );
  });

  it('works with dependencies', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/dependencies`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd, sdk: '@sentry/react' });

    const actual = getDirFileContent(cwd, 'package.json');
    expect(actual).toEqual(
      `{
  "dependencies": {
    "@sentry/hub": "^${latestV7Version}",
    "@sentry/integrations": "^${latestV7Version}",
    "@sentry/react": "^${latestVersion}",
    "@sentry/replay": "^${latestV7Version}",
    "@sentry/tracing": "^${latestV7Version}",
    "is-even": "1.0.0"
  },
  "devDependencies": {
    "is-odd": "3.0.1"
  }
}
`
    );
  });

  it('works with devDependencies', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/devDependencies`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd });

    const actual = getDirFileContent(cwd, 'package.json');
    expect(actual).toEqual(
      `{
  "dependencies": {
    "@sentry/integrations": "^${latestV7Version}",
    "is-even": "1.0.0"
  },
  "devDependencies": {
    "@sentry/hub": "^${latestV7Version}",
    "@sentry/react": "^${latestVersion}",
    "@sentry/tracing": "^${latestV7Version}",
    "is-odd": "3.0.1"
  }
}
`
    );
  });

  it('works with yarn', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/withYarn`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd });

    const actual = getDirFileContent(cwd, 'package.json');
    expect(actual).toEqual(
      `{
  "dependencies": {
    "@sentry/hub": "^${latestV7Version}",
    "@sentry/integrations": "^${latestV7Version}",
    "@sentry/react": "^${latestVersion}",
    "@sentry/replay": "^${latestV7Version}",
    "is-even": "1.0.0"
  },
  "devDependencies": {
    "is-odd": "3.0.1"
  }
}
`
    );
  });

  it('works with pnpm', async () => {
    tmpDir = makeTmpDir(getFixturePath('outdatedVersion'));
    const cwd = `${tmpDir}/withPnpm`;
    await sdkLatestVersionTransformer.transform([cwd], { filePatterns: [], cwd });

    const actual = getDirFileContent(cwd, 'package.json');
    expect(actual).toEqual(
      `{
  "dependencies": {
    "@sentry/hub": "~${latestV7Version}",
    "@sentry/integrations": "~${latestV7Version}",
    "@sentry/react": "~${latestVersion}",
    "@sentry/replay": "~${latestV7Version}",
    "is-even": "1.0.0"
  },
  "devDependencies": {
    "is-odd": "3.0.1"
  }
}
`
    );
  });
});
