// Sentry server-side init.
// Loaded by Next.js via instrumentation.ts on Node.js runtime startup.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,

    tracesSampleRate: 0.1,

    // Drop noise we expect in normal operation.
    ignoreErrors: [
      // Webhook handler rejecting events for unknown customers is correct
      // behaviour, not a bug worth alerting on. The handler logs these
      // anyway via the error column in webhook_events.
      'Entity not found for customer',
      // RLS denials from anon users probing routes — by design.
      'PGRST301',
      'PGRST302',
    ],
  });
}
