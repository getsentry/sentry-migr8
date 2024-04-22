import { BrowserTracing, Integrations, breadcrumbsIntegration } from '@sentry/browser';

function doSomething() {
  const a = new BrowserTracing();
  const b = new Integrations.BrowserTracing();
  const c = breadcrumbsIntegration();
  const d = new Integrations.Breadcrumbs();
}
