// Next.js 15 instrumentation hook — runs once per Node.js / edge worker
// startup. Wires @sentry/nextjs into both runtimes so server-side errors
// reach Sentry as soon as the process boots.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export { onRequestError } from '@sentry/nextjs';
