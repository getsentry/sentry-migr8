const { BrowserTracing, Integrations } = require('@sentry/browser');
const Sentry = require('@sentry/browser');
const SentryIntegrations =  require('@sentry/integrations');
const { HttpClient } = require('@sentry/integrations');

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
