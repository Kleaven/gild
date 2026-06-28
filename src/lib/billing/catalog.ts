import 'server-only';

import { env } from '../env';
import type { Plan } from './plans';

export interface PlanConfig {
  id: Plan;
  name: string;
  priceId: string | null;
  unitAmountCents: number;
  monthlyUsd: number;
  features: string[];
}

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceId: null,
    unitAmountCents: 0,
    monthlyUsd: 0,
    features: [
      'Unlimited members',
      'Unlimited spaces',
      'Courses, quizzes & certificates',
      'Paid memberships & community feed',
      'Analytics dashboard',
      '5% per member transaction',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceId: env.STRIPE_PRO_PRICE_ID,
    unitAmountCents: 2900,
    monthlyUsd: 29,
    features: [
      'Everything in Free',
      '0% platform fees — keep 100%',
      'Your own custom domain',
      'Remove Gild branding',
      'Priority support',
    ],
  },
};

export function getPlanByPriceId(priceId: string): Plan | null {
  for (const [plan, config] of Object.entries(PLANS)) {
    if (config.priceId && config.priceId === priceId) return plan as Plan;
  }
  return null;
}
