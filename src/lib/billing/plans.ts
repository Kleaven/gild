import 'server-only';

import type Stripe from 'stripe';
import { env } from '../env';

export type Plan = 'free' | 'pro';

// Resolve plan by Stripe price ID (primary path). Only Pro has a paid
// subscription now — Free communities carry no Stripe subscription at all, so
// any active subscription resolves to Pro.
export function resolvePlan(sub: Stripe.Subscription): Plan {
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  if (priceId === env.STRIPE_PRO_PRICE_ID) return 'pro';
  // Fallback: any paying subscription is Pro; $0/none is Free.
  const amount = item?.price?.unit_amount ?? 0;
  return amount > 0 ? 'pro' : 'free';
}

export function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === 'string' ? customer : customer.id;
}
