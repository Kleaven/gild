// Sentry client SDK init. Loaded automatically by Next.js on every browser
// page. File location (src/instrumentation-client.ts) is required by
// Next.js 15.3+; do not move to project root.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://a2f45666bbc274664412c5feaebcd287@o4511448798527488.ingest.us.sentry.io/4511448810455040',

  environment: process.env.NODE_ENV,

  // Session Replay only when an error occurs. Baseline 0% (privacy +
  // free-tier preservation), 10% on errors so we can rewatch what the
  // user did just before things broke.
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  // 10% performance trace sampling — the YC balance between signal and
  // quota usage. Bump up after launch if free tier proves too sparse.
  tracesSampleRate: 0.1,

  // Logs OFF by default — too easy to accidentally leak data via
  // console.log. Selectively enable for high-value contexts later.
  enableLogs: false,

  // PII OFF by default — only collect what we explicitly opt in to via
  // Sentry.setUser(). Re-evaluate at launch when GDPR/PDPA scope is set.
  sendDefaultPii: false,

  // Filter known benign noise so we don't burn quota on recoverable
  // events.
  ignoreErrors: [
    // Supabase auth refresh failures are recoverable and frequent.
    'AuthRetryableFetchError',
    'AuthApiError: refresh_token_already_used',
    // Browser extensions injecting fetch errors we can't act on.
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // Strip secrets from any captured URL params before transmission.
  beforeSend(event) {
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url);
        for (const secretParam of ['token', 'setup_token', 'access_token']) {
          if (url.searchParams.has(secretParam)) {
            url.searchParams.set(secretParam, '[REDACTED]');
          }
        }
        event.request.url = url.toString();
      } catch {
        // URL parse failed — leave as-is.
      }
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
