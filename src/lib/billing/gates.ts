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
