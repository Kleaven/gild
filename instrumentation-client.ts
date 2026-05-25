// Sentry client-side init.
// File MUST be named instrumentation-client.ts at the project root for
// Next.js 15.3+ / @sentry/nextjs v10. The legacy sentry.client.config.ts
// is no longer auto-detected — the SDK silently fails to initialize,
// taking the /monitoring/* tunnel route registration with it.
// DSN is the only value needed here; it's safe to expose (it identifies
// the project but doesn't grant write access beyond ingestion).

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    // Performance traces — 10% in prod is the YC standard balance between
    // signal and quota usage. Bump up later if free tier proves too sparse.
    tracesSampleRate: 0.1,

    // Session Replay — capture 10% of sessions where an error occurred.
    // 0% baseline (privacy + free-tier preservation), 10% on errors so we
    // can rewatch what the user did just before things broke.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    // Filter known noise so we don't burn quota on benign events.
    ignoreErrors: [
      // Supabase auth refresh failures are recoverable and frequent.
      'AuthRetryableFetchError',
      'AuthApiError: refresh_token_already_used',
      // Browser extensions injecting fetch errors we can't act on.
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],

    // Strip the auth token from any captured URL params before sending.
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          if (url.searchParams.has('token')) {
            url.searchParams.set('token', '[REDACTED]');
            event.request.url = url.toString();
          }
        } catch {
          // URL parsing failed — leave as-is.
        }
      }
      return event;
    },
  });
}
