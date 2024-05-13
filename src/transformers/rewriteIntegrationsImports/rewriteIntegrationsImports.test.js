import { rmSync } from 'node:fs';

import { afterEach, describe, it, expect } from 'vitest';

import { getDirFileContent, getFixturePath, makeTmpDir } from '../../../test-helpers/testPaths.js';

import transformer from './index.js';

describe('transformers | rewriteIntegrationsImports', () => {
  let tmpDir = '';

  afterEach(() => {
    if (tmpDir) {
      rmSync(tmpDir, { force: true, recursive: true });
      tmpDir = '';
    }
  });

  it('has correct name', () => {
    expect(transformer.name).toBe('Remove `@sentry/integrations` imports');
  });

  it('works with app without Sentry', async () => {
    tmpDir = makeTmpDir(getFixturePath('noSentry'));
    await transformer.transform([tmpDir], { filePatterns: [] });

    const actual1 = getDirFileContent(tmpDir, 'app.js');
    expect(actual1).toEqual(getDirFileContent(`${process.cwd()}/test-fixtures/noSentry`, 'app.js'));
  });

  it('works with example files', async () => {
    tmpDir = makeTmpDir(getFixturePath('integrations'));
    await transformer.transform([tmpDir], { filePatterns: [], sdk: '@sentry/browser' });

    const withImports = getDirFileContent(tmpDir, 'withImports.js');
    const withImportsTs = getDirFileContent(tmpDir, 'withImports.ts');
    const withRequire = getDirFileContent(tmpDir, 'withRequire.js');
    const dedupeImports = getDirFileContent(tmpDir, 'dedupeImports.js');
    const simpleImportIntegrations = getDirFileContent(tmpDir, 'simpleImportIntegrations.js');
    const simpleRequireIntegrations = getDirFileContent(tmpDir, 'simpleRequireIntegrations.js');
    const integrationsFunctionalImport = getDirFileContent(tmpDir, 'integrationsFunctionalImport.js');

    expect(withImports).toEqual(
      `import * as Sentry from '@sentry/browser';

function orig() {
  // do something
}

function doSomething() {
  // Check different invocations
  const a = new Sentry.BrowserTracing();
  const b = new Sentry.BrowserTracing({ option: 'value' });
  const c = new Sentry.BrowserTracing({ option: 'value' });
  const d = new Integrations.BrowserTracing({ option: 'value' });
  const e = new Integrations.Breadcrumbs({ option: 'value' });
  const f = new Integrations.CaptureConsole({ option: 'value' });
  const g = new Sentry.Integrations.ContextLines();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    // Browser
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
    new Sentry.Feedback(),
    new Sentry.Breadcrumbs(),
    new Sentry.TryCatch(),
    new Sentry.GlobalHandlers(),
    new Sentry.HttpContext(),
    // Core
    new Sentry.InboundFilters(),
    new Sentry.FunctionToString(),
    new Sentry.LinkedErrors(),
    new Sentry.ModuleMetadata(),
    new Sentry.RequestData(),
    // Integrations
    new Sentry.HttpClient(),
    new Sentry.HttpClient(),
    new Sentry.CaptureConsole(),
    new Sentry.Debug(),
    new Sentry.Dedupe(),
    new Sentry.ExtraErrorData(),
    new Sentry.ReportingObserver(),
    new Sentry.RewriteFrames(),
    new Sentry.SessionTiming(),
    new Sentry.ContextLines(),
    // Node
    new Sentry.Console(),
    new Sentry.Http(),
    new Sentry.OnUncaughtException(),
    new Sentry.OnUnhandledRejection(),
    new Sentry.Modules(),
    new Sentry.ContextLines(),
    new Sentry.Context(),
    new Sentry.LocalVariables(),
    new Sentry.Undici(),
    new Sentry.Spotlight(),
    new Sentry.Anr(),
    new Sentry.Hapi(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new Sentry.MyIntegration();
}
`
    );

    expect(withImportsTs).toEqual(
      `import * as Sentry from '@sentry/browser';

function orig(): void {
  // do something
}

function doSomething(): void {
  // Check different invocations
  const a = new Sentry.BrowserTracing();
  const b = new Sentry.BrowserTracing({ option: 'value' });
  const c = new Sentry.BrowserTracing({ option: 'value' });
  const d = new Integrations.BrowserTracing({ option: 'value' });
  const e = new Integrations.Breadcrumbs({ option: 'value' });
  const f = new Integrations.CaptureConsole({ option: 'value' });
  const g = new Sentry.Integrations.ContextLines();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    // Browser
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
    new Sentry.Feedback(),
    new Sentry.Breadcrumbs(),
    new Sentry.TryCatch(),
    new Sentry.GlobalHandlers(),
    new Sentry.HttpContext(),
    // Core
    new Sentry.InboundFilters(),
    new Sentry.FunctionToString(),
    new Sentry.LinkedErrors(),
    new Sentry.ModuleMetadata(),
    new Sentry.RequestData(),
    // Integrations
    new Sentry.HttpClient(),
    new Sentry.HttpClient(),
    new Sentry.CaptureConsole(),
    new Sentry.Debug(),
    new Sentry.Dedupe(),
    new Sentry.ExtraErrorData(),
    new Sentry.ReportingObserver(),
    new Sentry.RewriteFrames(),
    new Sentry.SessionTiming(),
    new Sentry.ContextLines(),
    // Node
    new Sentry.Console(),
    new Sentry.Http(),
    new Sentry.OnUncaughtException(),
    new Sentry.OnUnhandledRejection(),
    new Sentry.Modules(),
    new Sentry.ContextLines(),
    new Sentry.Context(),
    new Sentry.LocalVariables(),
    new Sentry.Undici(),
    new Sentry.Spotlight(),
    new Sentry.Anr(),
    new Sentry.Hapi(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new Sentry.MyIntegration();
}
`
    );

    expect(withRequire).toEqual(
      `const { BrowserTracing, Integrations } = require('@sentry/browser');
const Sentry = require('@sentry/browser');
const SentryIntegrations =  require("@sentry/browser");
const { HttpClient } = require("@sentry/browser");

function orig() {
  // do something
}

function doSomething() {
  // Check different invocations
  const a = new BrowserTracing();
  const b = new BrowserTracing({ option: 'value' });
  const c = new Sentry.BrowserTracing({ option: 'value' });
  const d = new Integrations.BrowserTracing({ option: 'value' });
  const e = new Integrations.Breadcrumbs({ option: 'value' });
  const f = new Integrations.CaptureConsole({ option: 'value' });
  const g = new Sentry.Integrations.ContextLines();
  const h = new Sentry.SomethingElse.Span();

  const integrations = [
    // Browser
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
    new Sentry.Feedback(),
    new Sentry.Breadcrumbs(),
    new Sentry.TryCatch(),
    new Sentry.GlobalHandlers(),
    new Sentry.HttpContext(),
    // Core
    new Sentry.InboundFilters(),
    new Sentry.FunctionToString(),
    new Sentry.LinkedErrors(),
    new Sentry.ModuleMetadata(),
    new Sentry.RequestData(),
    // Integrations
    new SentryIntegrations.HttpClient(),
    new HttpClient(),
    new SentryIntegrations.CaptureConsole(),
    new SentryIntegrations.Debug(),
    new SentryIntegrations.Dedupe(),
    new SentryIntegrations.ExtraErrorData(),
    new SentryIntegrations.ReportingObserver(),
    new SentryIntegrations.RewriteFrames(),
    new SentryIntegrations.SessionTiming(),
    new SentryIntegrations.ContextLines(),
    // Node
    new Sentry.Console(),
    new Sentry.Http(),
    new Sentry.OnUncaughtException(),
    new Sentry.OnUnhandledRejection(),
    new Sentry.Modules(),
    new Sentry.ContextLines(),
    new Sentry.Context(),
    new Sentry.LocalVariables(),
    new Sentry.Undici(),
    new Sentry.Spotlight(),
    new Sentry.Anr(),
    new Sentry.Hapi(),
  ];

  // Other classes are ignored
  const x = new MyClass();
  const y = new Sentry.Span();
  const z = new SentryIntegrations.MyIntegration();
}
`
    );

    expect(dedupeImports).toEqual(
      `import { BrowserTracing, Integrations, breadcrumbsIntegration } from '@sentry/browser';

function doSomething() {
  const a = new BrowserTracing();
  const b = new Integrations.BrowserTracing();
  const c = breadcrumbsIntegration();
  const d = new Integrations.Breadcrumbs();
}
`
    );

    expect(simpleImportIntegrations).toEqual(
      `import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.init({
    integrations: [new Sentry.HttpClient()]
  });
}
`
    );

    expect(simpleRequireIntegrations).toEqual(
      `const Sentry = require('@sentry/browser');
const { HttpClient } = require("@sentry/browser");

function doSomething() {
  Sentry.init({
    integrations: [new HttpClient()]
  });
}
`
    );

    expect(integrationsFunctionalImport).toEqual(
      `import * as Sentry from '@sentry/browser';

function doSomething() {
  Sentry.init({
    integrations: [Sentry.httpClientIntegration()]
  });
}
`
    );
  });
});
