// lib/billing barrel — grows with Step 40 (webhook), Step 41 (catalog),
// Step 42 (subscription lifecycle).
export { stripe } from './stripe';
export { processWebhookEvent } from './webhook';
export type { WebhookHandlerMap } from './webhook';
export { resolvePlan, extractCustomerId } from './plans';
export type { Plan } from './plans';
export { PLANS, getPlanByPriceId } from './catalog';
export type { PlanConfig } from './catalog';
export {
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
} from './subscription';
export type { CheckoutReturnContext } from './subscription';
export {
  isAccessGranted,
  isPro,
  isHobby,
  getPlanLabel,
} from './gates';
export type { CommunityBillingState, SubscriptionStatus } from './gates';
export {
  queueDunningEmail,
  checkAndQueueExpiringTrials,
  checkAndQueueExpiredTrials,
  checkAndQueuePastDue,
} from './dunning';
export type { DunningEmailType } from './dunning';
