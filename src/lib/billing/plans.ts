import 'server-only';

import type Stripe from 'stripe';

// STRIPE_STARTER_PRICE_ID / STRIPE_PRO_PRICE_ID are absent from env.ts,
// so we resolve plan by unit_amount: < 5000 cents → starter, >= 5000 → pro.
// If price IDs are added to env in a later step this function can be updated.
export function resolvePlan(sub: Stripe.Subscription): 'starter' | 'pro' {
  const item = sub.items.data[0];
  const amount = item?.price.unit_amount ?? 0;
  return amount >= 5000 ? 'pro' : 'starter';
}

export function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === 'string' ? customer : customer.id;
}
