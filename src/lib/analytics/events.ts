// Client-side analytics event helpers. Wraps posthog.capture() with named
// events + typed properties so we never spell event names wrong or drift
// between call sites. Server-side captures (e.g., from webhook handlers)
// happen via posthog-node in a future iteration — for now everything is
// client-fired.

import posthog from 'posthog-js';

type SignupSource = 'email_password' | 'oauth_google';

export function trackSignup(source: SignupSource): void {
  posthog.capture('signup_completed', { source });
}

export function trackCommunityCreated(communityId: string, plan: 'hobby' | 'pro' | 'trial'): void {
  posthog.capture('community_created', { community_id: communityId, plan });
}

export function trackPostPublished(communityId: string, spaceId: string, postType: 'post' | 'poll'): void {
  posthog.capture('post_published', {
    community_id: communityId,
    space_id: spaceId,
    post_type: postType,
  });
}

export function trackSubscriptionStarted(
  communityId: string,
  plan: 'hobby' | 'pro',
  trial: boolean,
): void {
  posthog.capture('subscription_started', {
    community_id: communityId,
    plan,
    trial,
  });
}
