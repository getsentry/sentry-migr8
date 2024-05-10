import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import integrationsTransformer from './index.js';

describe('transformers | integrations', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(integrationsTransformer.name, 'Use functional integrations instead of integration classes');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await integrationsTransformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1, getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('integrations'));
    await integrationsTransformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'withImports.js');
    const withImportsTs = getDirFileContent(tmpDir, 'withImports.ts');
    const withRequire = getDirFileContent(tmpDir, 'withRequire.js');
    const dedupeImports = getDirFileContent(tmpDir, 'dedupeImports.js');
    const dedupeRequire = getDirFileContent(tmpDir, 'dedupeRequire.js');
    const simpleImport = getDirFileContent(tmpDir, 'simpleImport.js');
    const simpleNamespaceImport = getDirFileContent(tmpDir, 'simpleNamespaceImport.js');
    const simpleRequire = getDirFileContent(tmpDir, 'simpleRequire.js');
    const simpleNamespaceRequire = getDirFileContent(tmpDir, 'simpleNamespaceRequire.js');
    const simpleImportIntegrations = getDirFileContent(tmpDir, 'simpleImportIntegrations.js');
    const simpleRequireIntegrations = getDirFileContent(tmpDir, 'simpleRequireIntegrations.js');
    const integrationsFunctionalImport = getDirFileContent(tmpDir, 'integrationsFunctionalImport.js');

    expect(withImports).toEqual(
      `import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { httpClientIntegration } from '@sentry/integrations';

function orig() {
  // do something
}

function doSomething() {
  // Check different invocations
  const a = Sentry.browserTracingIntegration();
  const b = Sentry.browserTracingIntegration({ option: 'value' });
  const c = Sentry.browserTracingIntegration({ option: 'value' });
  const d = Sentry.browserTracingIntegration({ option: 'value' });
  const e = Sentry.breadcrumbsIntegration({ option: 'value' });
  const f = Sentry.captureConsoleIntegration({ option: 'value' });
  const g = Sentry.contextLinesIntegration();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration(),
    Sentry.breadcrumbsIntegration(),
    Sentry.browserApiErrorsIntegration(),
    Sentry.globalHandlersIntegration(),
    Sentry.httpContextIntegration(),
    Sentry.inboundFiltersIntegration(),
    Sentry.functionToStringIntegration(),
    Sentry.linkedErrorsIntegration(),
    Sentry.moduleMetadataIntegration(),
    Sentry.requestDataIntegration(),
    SentryIntegrations.httpClientIntegration(),
    httpClientIntegration(),
    SentryIntegrations.captureConsoleIntegration(),
    SentryIntegrations.debugIntegration(),
    SentryIntegrations.dedupeIntegration(),
    SentryIntegrations.extraErrorDataIntegration(),
    SentryIntegrations.reportingObserverIntegration(),
    SentryIntegrations.rewriteFramesIntegration(),
    SentryIntegrations.sessionTimingIntegration(),
    SentryIntegrations.contextLinesIntegration(),
    Sentry.consoleIntegration(),
    Sentry.httpIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.modulesIntegration(),
    Sentry.contextLinesIntegration(),
    Sentry.nodeContextIntegration(),
    Sentry.localVariablesIntegration(),
    Sentry.nodeFetchIntegration(),
    Sentry.spotlightIntegration(),
    Sentry.anrIntegration(),
    Sentry.hapiIntegration(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new SentryIntegrations.MyIntegration();
}
`
    );

    expect(withImportsTs).toEqual(
      `import * as Sentry from '@sentry/browser';
import * as SentryIntegrations from '@sentry/integrations';
import { httpClientIntegration } from '@sentry/integrations';

function orig(): void {
  // do something
}

function doSomething(): void {
  // Check different invocations
  const a = Sentry.browserTracingIntegration();
  const b = Sentry.browserTracingIntegration({ option: 'value' });
  const c = Sentry.browserTracingIntegration({ option: 'value' });
  const d = Sentry.browserTracingIntegration({ option: 'value' });
  const e = Sentry.breadcrumbsIntegration({ option: 'value' });
  const f = Sentry.captureConsoleIntegration({ option: 'value' });
  const g = Sentry.contextLinesIntegration();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration(),
    Sentry.breadcrumbsIntegration(),
    Sentry.browserApiErrorsIntegration(),
    Sentry.globalHandlersIntegration(),
    Sentry.httpContextIntegration(),
    Sentry.inboundFiltersIntegration(),
    Sentry.functionToStringIntegration(),
    Sentry.linkedErrorsIntegration(),
    Sentry.moduleMetadataIntegration(),
    Sentry.requestDataIntegration(),
    SentryIntegrations.httpClientIntegration(),
    httpClientIntegration(),
    SentryIntegrations.captureConsoleIntegration(),
    SentryIntegrations.debugIntegration(),
    SentryIntegrations.dedupeIntegration(),
    SentryIntegrations.extraErrorDataIntegration(),
    SentryIntegrations.reportingObserverIntegration(),
    SentryIntegrations.rewriteFramesIntegration(),
    SentryIntegrations.sessionTimingIntegration(),
    SentryIntegrations.contextLinesIntegration(),
    Sentry.consoleIntegration(),
    Sentry.httpIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.modulesIntegration(),
    Sentry.contextLinesIntegration(),
    Sentry.nodeContextIntegration(),
    Sentry.localVariablesIntegration(),
    Sentry.nodeFetchIntegration(),
    Sentry.spotlightIntegration(),
    Sentry.anrIntegration(),
    Sentry.hapiIntegration(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new SentryIntegrations.MyIntegration();
}
`
    );

    expect(withRequire).toEqual(
      `const {
  browserTracingIntegration,
  breadcrumbsIntegration,
  captureConsoleIntegration
} = require('@sentry/browser');
const Sentry = require('@sentry/browser');
const SentryIntegrations =  require('@sentry/integrations');
const { httpClientIntegration } = require('@sentry/integrations');

function orig() {
  // do something
}

function doSomething() {
  // Check different invocations
  const a = browserTracingIntegration();
  const b = browserTracingIntegration({ option: 'value' });
  const c = Sentry.browserTracingIntegration({ option: 'value' });
  const d = browserTracingIntegration({ option: 'value' });
  const e = breadcrumbsIntegration({ option: 'value' });
  const f = captureConsoleIntegration({ option: 'value' });
  const g = Sentry.contextLinesIntegration();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    Sentry.feedbackIntegration(),
    Sentry.breadcrumbsIntegration(),
    Sentry.browserApiErrorsIntegration(),
    Sentry.globalHandlersIntegration(),
    Sentry.httpContextIntegration(),
    Sentry.inboundFiltersIntegration(),
    Sentry.functionToStringIntegration(),
    Sentry.linkedErrorsIntegration(),
    Sentry.moduleMetadataIntegration(),
    Sentry.requestDataIntegration(),
    SentryIntegrations.httpClientIntegration(),
    httpClientIntegration(),
    SentryIntegrations.captureConsoleIntegration(),
    SentryIntegrations.debugIntegration(),
    SentryIntegrations.dedupeIntegration(),
    SentryIntegrations.extraErrorDataIntegration(),
    SentryIntegrations.reportingObserverIntegration(),
    SentryIntegrations.rewriteFramesIntegration(),
    SentryIntegrations.sessionTimingIntegration(),
    SentryIntegrations.contextLinesIntegration(),
    Sentry.consoleIntegration(),
    Sentry.httpIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.modulesIntegration(),
    Sentry.contextLinesIntegration(),
    Sentry.nodeContextIntegration(),
    Sentry.localVariablesIntegration(),
    Sentry.nodeFetchIntegration(),
    Sentry.spotlightIntegration(),
    Sentry.anrIntegration(),
    Sentry.hapiIntegration(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new SentryIntegrations.MyIntegration();
}
`
    );

    expect(dedupeImports).toEqual(
      `import { browserTracingIntegration, breadcrumbsIntegration } from '@sentry/browser';

function doSomething() {
  const a = browserTracingIntegration();
  const b = browserTracingIntegration();
  const c = breadcrumbsIntegration();
  const d = breadcrumbsIntegration();
}
`
    );

    expect(dedupeRequire).toEqual(
      `const {
  browserTracingIntegration,
  breadcrumbsIntegration
} = require('@sentry/browser');

function doSomething() {
  const a = browserTracingIntegration();
  const b = browserTracingIntegration();
  const c = breadcrumbsIntegration();
  const d = breadcrumbsIntegration();
}
`
    );

    expect(simpleImport).toEqual(
      `import { init, browserTracingIntegration } from '@sentry/browser';

function doSomething() {
  init({
    integrations: [browserTracingIntegration()]
  });
}
`
    );

    expect(simpleNamespaceImport).toEqual(
      `import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.init({
    integrations: [Sentry.browserTracingIntegration()]
  });
}
`
    );

    expect(simpleRequire).toEqual(
      `const { init, browserTracingIntegration } = require('@sentry/browser');

function doSomething() {
  init({
    integrations: [browserTracingIntegration()]
  });
}
`
    );

    expect(simpleNamespaceRequire).toEqual(
      `const Sentry = require('@sentry/browser');

function doSomething() {
  Sentry.init({
    integrations: [Sentry.browserTracingIntegration()]
  });
}
`
    );

    expect(simpleImportIntegrations).toEqual(
      `import * as Sentry from '@sentry/browser';
import { httpClientIntegration } from '@sentry/integrations';

function doSomething() {
  Sentry.init({
    integrations: [httpClientIntegration()]
  });
}
`
    );

    expect(simpleRequireIntegrations).toEqual(
      `const Sentry = require('@sentry/browser');
const { httpClientIntegration } = require('@sentry/integrations');

function doSomething() {
  Sentry.init({
    integrations: [httpClientIntegration()]
  });
}
`
    );

    expect(integrationsFunctionalImport).toEqual(
      `import * as Sentry from '@sentry/browser';
import { httpClientIntegration } from '@sentry/integrations';

function doSomething() {
  Sentry.init({
    integrations: [httpClientIntegration()]
  });
}
`
    );
  });
});
