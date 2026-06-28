// Client-side analytics event helpers. Wraps posthog.capture() with named
// events + typed properties so we never spell event names wrong or drift
// between call sites. The `subscription_started` event is fired SERVER-side
// from the Stripe webhook (see lib/analytics/server.ts) — it must not also be
// fired here, or it would double-count.

import posthog from 'posthog-js';

type SignupSource = 'email_password' | 'oauth_google';

export function trackSignup(source: SignupSource): void {
  posthog.capture('signup_completed', { source });
}

export function trackCommunityCreated(communityId: string, plan: 'free' | 'pro' | 'trial'): void {
  posthog.capture('community_created', { community_id: communityId, plan });
}

export function trackPostPublished(communityId: string, spaceId: string, postType: 'post' | 'poll'): void {
  posthog.capture('post_published', {
    community_id: communityId,
    space_id: spaceId,
    post_type: postType,
  });
}
