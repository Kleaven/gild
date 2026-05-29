import 'server-only';

// Server-side analytics capture for events that must fire reliably outside
// the browser — chiefly Stripe webhooks, where the client tab may be closed
// when a subscription actually starts.
//
// We POST to PostHog's HTTP capture endpoint with an awaited fetch rather than
// using posthog-node. In a serverless runtime the function freezes between
// invocations, so a batching SDK can drop events that were never flushed; a
// single awaited request has no such failure mode and needs no dependency.
//
// Reads NEXT_PUBLIC_POSTHOG_* directly from process.env — the same source the
// browser provider uses. (env.ts validates these but does not forward them
// onto its parsed object, so reading process.env is the established pattern.)
// Never throws: analytics must never break the business logic that calls it.

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

type CaptureInput = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent({
  distinctId,
  event,
  properties,
}: CaptureInput): Promise<void> {
  if (!POSTHOG_KEY || !POSTHOG_HOST) return; // No-op when analytics isn't configured.

  try {
    const res = await fetch(`${POSTHOG_HOST.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'gild-server' },
        timestamp: new Date().toISOString(),
      }),
      // Never let a slow analytics endpoint hold a webhook response open.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.error(`[analytics] capture "${event}" failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[analytics] capture "${event}" error:`, err);
  }
}

// Mirrors the client-side `subscription_started` event so server- and
// client-fired data line up on the same person (distinct_id = Supabase user id).
export async function trackSubscriptionStartedServer(input: {
  distinctId: string;
  communityId: string | null;
  plan: 'hobby' | 'pro';
  trial: boolean;
}): Promise<void> {
  await captureServerEvent({
    distinctId: input.distinctId,
    event: 'subscription_started',
    properties: {
      community_id: input.communityId,
      plan: input.plan,
      trial: input.trial,
    },
  });
}
