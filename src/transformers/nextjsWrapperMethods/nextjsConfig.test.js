import { afterEach, describe, it } from 'node:test';
import * as assert from 'node:assert';
import { rmSync } from 'node:fs';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';
import { assertStringEquals } from '../../../test-helpers/assert.js';

import nextjsWrapperMethodsTransformer from './index.js';

describe('transformers | nextjsWrapperMethods', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    assert.equal(nextjsWrapperMethodsTransformer.name, 'Next.js Wrapper Methods v7>v8');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await nextjsWrapperMethodsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    assert.equal(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('nextjsApp'));
    await nextjsWrapperMethodsTransformer.transform([tmpDir], { filePatterns: [] });

    const withImports = getDirFileContent(tmpDir, 'withImports.js');
    const withImportsTs = getDirFileContent(tmpDir, 'withImports.ts');
    const withRequire = getDirFileContent(tmpDir, 'withRequire.js');
    const withoutNextImport = getDirFileContent(tmpDir, 'withoutNextImport.js');

    assertStringEquals(
      withImports,
      `import { wrapApiHandlerWithSentry, wrapGetInitialPropsWithSentry as myRewrite, otherImport } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';

function orig() {
  // do something
}

function doSomething() {
  wrapApiHandlerWithSentry(orig, 'arg1');
  myRewrite(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.wrapApiHandlerWithSentry(orig, 'arg2');
  Sentry.wrapGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapDocumentGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapGetServerSidePropsWithSentry(orig, 'arg2');
  Sentry.wrapGetStaticPropsWithSentry(orig, 'arg2');
  Sentry.wrapApiWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.someOtherMethod(orig, 'arg2');
  otherImport(orig, 'arg2');
}`
    );
    assertStringEquals(
      withImportsTs,
      `import { wrapApiHandlerWithSentry, wrapGetInitialPropsWithSentry as myRewrite, otherImport } from '@sentry/nextjs';
import * as Sentry from '@sentry/nextjs';

function orig(): void {
  // do something
}

function doSomething(): void {
  wrapApiHandlerWithSentry(orig, 'arg1');
  myRewrite(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.wrapApiHandlerWithSentry(orig, 'arg2');
  Sentry.wrapGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapDocumentGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapGetServerSidePropsWithSentry(orig, 'arg2');
  Sentry.wrapGetStaticPropsWithSentry(orig, 'arg2');
  Sentry.wrapApiWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.someOtherMethod(orig, 'arg2');
  otherImport(orig, 'arg2');
}`
    );

    assertStringEquals(
      withRequire,
      `const { wrapApiHandlerWithSentry, wrapGetInitialPropsWithSentry: myRewrite, otherImport } = require('@sentry/nextjs');
const Sentry = require('@sentry/nextjs');

function orig() {
  // do something
}

function doSomething() {
  wrapApiHandlerWithSentry(orig, 'arg1');
  myRewrite(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.wrapApiHandlerWithSentry(orig, 'arg2');
  Sentry.wrapGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapDocumentGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapErrorGetInitialPropsWithSentry(orig, 'arg2');
  Sentry.wrapGetServerSidePropsWithSentry(orig, 'arg2');
  Sentry.wrapGetStaticPropsWithSentry(orig, 'arg2');
  Sentry.wrapApiWithSentry(orig, 'arg2');
  Sentry.wrapAppGetInitialPropsWithSentry(orig, 'arg2');

  Sentry.someOtherMethod(orig, 'arg2');
  otherImport(orig, 'arg2');
}`
    );

    assertStringEquals(
      withoutNextImport,
      `import { withSentryAPI, withSentryServerSideGetInitialProps as myRewrite, otherImport } from '@sentry/OTHER';
import * as Sentry from '@sentry/OTHER';

function orig() {
  // do something
}

function doSomething() {
  withSentryAPI(orig, 'arg1');
  myRewrite(orig, 'arg2');
  Sentry.withSentryServerSideErrorGetInitialProps(orig, 'arg2');

  Sentry.withSentryAPI(orig, 'arg2');
  Sentry.withSentryServerSideGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideAppGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideDocumentGetInitialProps(orig, 'arg2');
  Sentry.withSentryServerSideErrorGetInitialProps(orig, 'arg2');
  Sentry.withSentryGetServerSideProps(orig, 'arg2');
  Sentry.withSentryGetStaticProps(orig, 'arg2');
  Sentry.withSentry(orig, 'arg2');
  Sentry.withSentryServerSideAppGetInitialProps(orig, 'arg2');

  Sentry.someOtherMethod(orig, 'arg2');
  otherImport(orig, 'arg2');
}`
    );
  });
});
