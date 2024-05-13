import fs from 'fs';

import {
  defaultStackParser,
  httpIntegration,
  makeNodeTransport,
  NodeClient,
  runWithAsyncContext,
  Scope,
  setCurrentClient,
  startSpan,
} from '@sentry/node';
import * as Sentry from '@sentry/node';

const packageJson = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)).toString());

/**
 *
 * @template F
 * @param {{enabled: boolean}} options
 * @param {() => F | Promise<F>} callback
 * @returns {Promise<void>}
 */
export async function withTelemetry(options, callback) {
  const { sentryClient } = createSentryInstance(options.enabled);

  await Sentry.startSpan(
    {
      name: 'sentry-migr8-execution',
      status: 'ok',
      op: 'migr8.flow',
    },
    async span => {
      const sentrySession = Sentry.startSession();
      Sentry.captureSession();

      try {
        return await runWithAsyncContext(() => callback());
      } catch (e) {
        Sentry.captureException('Error during migr8 execution.');
        span?.setStatus('internal_error');
        sentrySession.status = 'crashed';
        throw e;
      } finally {
        span?.end();
        Sentry.endSession();
        await sentryClient.flush(3000);
      }
    }
  );
}

/**
 * Creates a minimal Sentry instance
 * @param {boolean} enabled
 * @returns {{sentryScope: Scope, sentryClient: NodeClient}}
 */
function createSentryInstance(enabled) {
  const client = new NodeClient({
    dsn: 'https://213a6b07baab39624aa94dd08917c5c6@o1.ingest.sentry.io/4505760680837120',
    enabled,

    tracesSampleRate: 1,
    sampleRate: 1,

    release: packageJson.version,
    integrations: [httpIntegration()],
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

    debug: false,
  });

  const scope = new Scope();
  scope.setClient(client);

  client.init();

  setCurrentClient(client);

  return { sentryScope: scope, sentryClient: client };
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
