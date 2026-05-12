import type { Plan } from './plans';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export interface CommunityBillingState {
  plan: Plan;
  subscriptionStatus: SubscriptionStatus | null;
}

/**
 * Returns true only for active subscribers (trialing or active).
 * past_due loses access immediately — no grace period at this stage.
 */
export function isAccessGranted(state: CommunityBillingState): boolean {
  return (
    state.subscriptionStatus === 'trialing' ||
    state.subscriptionStatus === 'active'
  );
}

/** True only if plan is 'pro' AND subscription is active/trialing. */
export function isPro(state: CommunityBillingState): boolean {
  return state.plan === 'pro' && isAccessGranted(state);
}

/** True only if plan is 'hobby' AND subscription is active/trialing. */
export function isHobby(state: CommunityBillingState): boolean {
  return state.plan === 'hobby' && isAccessGranted(state);
}

/** Human-readable plan label for display. */
export function getPlanLabel(plan: Plan): string {
  return plan === 'hobby' ? 'Hobby' : 'Pro';
}

// ─── Tier Enforcement ────────────────────────────────────────────────────────

export const GILD_PLAN_LIMITS = {
  hobby: {
    maxMembers: 100,
    allowCustomDomain: false,
    allowAnalytics: false,
  },
  pro: {
    maxMembers: 1000000, // Effectively unlimited
    allowCustomDomain: true,
    allowAnalytics: true,
  }
};

export function canHaveUnlimitedMembers(plan: Plan): boolean {
  return plan === 'pro';
}

export function canUseCustomDomain(plan: Plan): boolean {
  return plan === 'pro';
}

export function canAccessAnalytics(plan: Plan): boolean {
  return plan === 'pro';
}

export function getMemberLimit(plan: Plan): number {
  return GILD_PLAN_LIMITS[plan].maxMembers;
}

export type GildFeature = 'analytics' | 'custom_domain' | 'unlimited_members' | 'courses' | 'priority_support';

export function isFeatureAllowed(plan: Plan, feature: GildFeature): boolean {
  switch (feature) {
    case 'analytics':
    case 'custom_domain':
    case 'unlimited_members':
    case 'priority_support':
      return plan === 'pro';
    case 'courses':
      return true; // Hobby and Pro both get courses
    default:
      return false;
  }
}
