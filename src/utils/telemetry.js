import fs from 'fs';

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
  Sentry.init({
    dsn: 'https://213a6b07baab39624aa94dd08917c5c6@o1.ingest.sentry.io/4505760680837120',
    enabled: options.enabled,

    tracesSampleRate: 1,
    sampleRate: 1,

    release: packageJson.version,

    defaultIntegrations: false,
    integrations: [Sentry.httpIntegration(), Sentry.nodeContextIntegration()],

    tracePropagationTargets: [/^https:\/\/sentry.io\//],

    stackParser: Sentry.defaultStackParser,

    beforeSendTransaction: event => {
      delete event.server_name; // Server name might contain PII

      event.contexts = {
        os: event.contexts?.os,
        trace: event.contexts?.trace,
      };

      return event;
    },

    beforeSend: event => {
      event.exception?.values?.forEach(exception => {
        delete exception.stacktrace;
      });

      event.contexts = {
        os: event.contexts?.os,
        trace: event.contexts?.trace,
      };

      return event;
    },

    transport: Sentry.makeNodeTransport,

    debug: false,
  });

  await Sentry.startSpan(
    {
      name: 'sentry-migr8-execution',
      op: 'migr8.flow',
    },
    async span => {
      const sentrySession = Sentry.startSession();
      Sentry.captureSession();

      try {
        return await Sentry.withScope(() => callback());
      } catch (e) {
        Sentry.captureException('Error during migr8 execution.');
        span?.setStatus('error');
        sentrySession.status = 'crashed';
        throw e;
      } finally {
        span?.end();
        Sentry.endSession();
        await Sentry.flush(3000);
      }
    }
  );
}

/**
 * Creates a span for the passed callback
 * @template F
 * @param {string} step
 * @param {() => F | Promise<F>} callback
 * @returns {Promise<F>}
 */
export async function traceStep(step, callback) {
  return Sentry.startSpan({ name: step, op: 'mgir8.step' }, () => callback());
}
