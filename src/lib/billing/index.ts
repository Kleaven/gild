// lib/billing barrel — grows with Step 40 (webhook), Step 41 (catalog),
// Step 42 (subscription lifecycle).
export { stripe } from './stripe';
export { processWebhookEvent } from './webhook';
export type { WebhookHandlerMap } from './webhook';
