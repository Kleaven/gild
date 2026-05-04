import 'server-only';

import { env } from '../env';
import type { Plan } from './plans';

export interface PlanConfig {
  id: Plan;
  name: string;
  priceId: string;
  unitAmountCents: number;
  monthlyUsd: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  hobby: {
    id: 'hobby',
    name: 'Hobby',
    priceId: env.STRIPE_HOBBY_PRICE_ID,
    unitAmountCents: 2900,
    monthlyUsd: 29,
    features: [
      'Up to 100 members',
      'Unlimited spaces',
      'Course hosting',
      'Community feed',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: env.STRIPE_PRO_PRICE_ID,
    unitAmountCents: 5900,
    monthlyUsd: 59,
    features: [
      'Unlimited members',
      'Unlimited spaces',
      'Course hosting',
      'Community feed',
      'Advanced analytics',
      'Custom domain',
      'Priority support',
    ],
  },
};

export function getPlanByPriceId(priceId: string): Plan | null {
  for (const [plan, config] of Object.entries(PLANS)) {
    if (config.priceId === priceId) return plan as Plan;
  }
  return null;
}
