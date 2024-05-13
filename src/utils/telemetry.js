import fs from 'fs';

import {
  defaultStackParser,
  Hub,
  Integrations,
  makeMain,
  makeNodeTransport,
  NodeClient,
  runWithAsyncContext,
  startSpan,
} from '@sentry/node';

const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)).toString());

/**
 *
 * @template F
 * @param {{enabled: boolean}} options
 * @param {() => F | Promise<F>} callback
 * @returns {Promise<F>}
 */
export async function withTelemetry(options, callback) {
  const { sentryHub, sentryClient } = createSentryInstance(options.enabled);

  makeMain(sentryHub);

  const transaction = sentryHub.startTransaction({
    name: 'sentry-migr8-execution',
    status: 'ok',
    op: 'migr8.flow',
  });
  sentryHub.getScope().setSpan(transaction);
  const sentrySession = sentryHub.startSession();
  sentryHub.captureSession();

  try {
    return await runWithAsyncContext(() => callback());
  } catch (e) {
    sentryHub.captureException('Error during migr8 execution.');
    transaction.setStatus('internal_error');
    sentrySession.status = 'crashed';
    throw e;
  } finally {
    transaction.finish();
    sentryHub.endSession();
    await sentryClient.flush(3000);
  }
}

/**
 * Creates a minimal Sentry instance
 * @param {boolean} enabled
 * @returns {{sentryHub: Hub, sentryClient: NodeClient}}
 */
function createSentryInstance(enabled) {
  const client = new NodeClient({
    dsn: 'https://213a6b07baab39624aa94dd08917c5c6@o1.ingest.sentry.io/4505760680837120',
    enabled,

    tracesSampleRate: 1,
    sampleRate: 1,

    release: packageJson.version,
    integrations: [new Integrations.Http()],
    tracePropagationTargets: [/^https:\/\/sentry.io\//],

    stackParser: defaultStackParser,

    beforeSendTransaction: event => {
      delete event.server_name; // Server name might contain PII
      return event;
    },

    beforeSend: event => {
      event.exception?.values?.forEach(exception => {
        delete exception.stacktrace;
      });

      delete event.server_name; // Server name might contain PII
      return event;
    },

    transport: makeNodeTransport,

    debug: true,
  });

  const hub = new Hub(client);

  hub.setTag('node', process.version);
  hub.setTag('platform', process.platform);

  return { sentryHub: hub, sentryClient: client };
}

/**
 * Creates a span for the passed callback
 * @template F
 * @param {string} step
 * @param {() => F | Promise<F>} callback
 * @returns {Promise<F>}
 */
export async function traceStep(step, callback) {
  return startSpan({ name: step, op: 'mgir8.step' }, () => callback());
}
