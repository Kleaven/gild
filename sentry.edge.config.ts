// Sentry edge-runtime init. Covers middleware + edge route handlers.
// Loaded by Next.js via src/instrumentation.ts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://a2f45666bbc274664412c5feaebcd287@o4511448798527488.ingest.us.sentry.io/4511448810455040',

  environment: process.env.NODE_ENV,

  tracesSampleRate: 0.1,
  enableLogs: false,
  sendDefaultPii: false,
});
