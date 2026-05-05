import 'server-only';

// resend client is intentionally NOT exported — it must not be accessible
// outside lib/email/ to prevent accidental use in client-visible code.
export { processPendingEmails } from './sender';
export { renderTemplate } from './templates';
export type { RenderedEmail } from './templates';
