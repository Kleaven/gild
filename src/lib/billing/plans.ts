import 'server-only';

import type Stripe from 'stripe';
import { env } from '../env';

export type Plan = 'hobby' | 'pro';

// Resolve plan by Stripe price ID (primary path).
// STRIPE_HOBBY_PRICE_ID / STRIPE_PRO_PRICE_ID are in env.ts server schema.
// unit_amount fallback retained as a safety net for any unmapped price IDs.
export function resolvePlan(sub: Stripe.Subscription): Plan {
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  if (priceId === env.STRIPE_HOBBY_PRICE_ID) return 'hobby';
  if (priceId === env.STRIPE_PRO_PRICE_ID) return 'pro';
  // Fallback: unit_amount guard — never throws on unknown price IDs
  const amount = item?.price?.unit_amount ?? 0;
  return amount >= 5000 ? 'pro' : 'hobby';
}

export function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === 'string' ? customer : customer.id;
}
