// Sentry server-side init. Loaded by Next.js via src/instrumentation.ts
// on every Node.js runtime startup (API routes, server actions, RSCs).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://a2f45666bbc274664412c5feaebcd287@o4511448798527488.ingest.us.sentry.io/4511448810455040',

  environment: process.env.NODE_ENV,

  // 10% performance trace sampling.
  tracesSampleRate: 0.1,

  // Logs OFF — would otherwise capture every server-side console call.
  enableLogs: false,

  // PII OFF — opt in selectively via Sentry.setUser() when identifying
  // an authenticated user is meaningful (RSC render that needs it).
  sendDefaultPii: false,

  // Drop noise we expect in normal operation.
  ignoreErrors: [
    // Webhook handler rejecting events for unknown customers is correct
    // behaviour — the handler logs these via the `error` column in
    // webhook_events. No need to also alert.
    'Entity not found for customer',
    // RLS denials from anon users probing routes — by design.
    'PGRST301',
    'PGRST302',
  ],
});
