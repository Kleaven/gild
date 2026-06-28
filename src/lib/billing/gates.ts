import type { Plan } from './plans';

/**
 * Platform fee taken on member→creator transactions for FREE communities.
 * Pro communities pay 0% (creator keeps 100% minus Stripe's own processing).
 * This is the single source of truth for the take rate.
 */
export const FREE_PLAN_FEE_PERCENT = 5;

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

/** True only if the community is on the Free plan (no paid subscription). */
export function isFree(state: CommunityBillingState): boolean {
  return state.plan === 'free';
}

/** Human-readable plan label for display. */
export function getPlanLabel(plan: Plan): string {
  return plan === 'free' ? 'Free' : 'Pro';
}

// ─── Tier Enforcement ────────────────────────────────────────────────────────
//
// Free and Pro share the full member-facing product. Pro differentiates on
// creator-side perks (0% fee, custom domain, badge removal) — NOT on member
// count: both plans get unlimited members so a free community can grow freely.

const UNLIMITED = Number.MAX_SAFE_INTEGER;

export const GILD_PLAN_LIMITS = {
  free: {
    maxMembers: UNLIMITED,
    allowCustomDomain: false,
    allowAnalytics: true, // Analytics is free on every plan — the basic dashboard is table stakes.
  },
  pro: {
    maxMembers: UNLIMITED,
    allowCustomDomain: true,
    allowAnalytics: true,
  }
};

export function canHaveUnlimitedMembers(_plan: Plan): boolean {
  return true; // Every plan now has unlimited members.
}

export function canUseCustomDomain(plan: Plan): boolean {
  return plan === 'pro';
}

/** Pro communities can hide the "Powered by Gild" badge. */
export function canRemoveGildBadge(plan: Plan): boolean {
  return plan === 'pro';
}

export function canAccessAnalytics(_plan: Plan): boolean {
  return true; // Analytics is available on every plan.
}

export function getMemberLimit(plan: Plan): number {
  return GILD_PLAN_LIMITS[plan].maxMembers;
}

export type GildFeature = 'analytics' | 'custom_domain' | 'unlimited_members' | 'courses' | 'priority_support';

export function isFeatureAllowed(plan: Plan, feature: GildFeature): boolean {
  switch (feature) {
    case 'custom_domain':
    case 'priority_support':
      return plan === 'pro';
    case 'analytics':
    case 'courses':
    case 'unlimited_members':
      return true; // Free and Pro both get analytics, courses, and unlimited members
    default:
      return false;
  }
}
