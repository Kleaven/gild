'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { resolveCommunitySlug } from '../../lib/community/context';
import {
  startConnectOnboarding,
  refreshConnectStatus,
  type ConnectStatus,
} from '../../lib/billing/connect';
import {
  createTier,
  updateTier,
  deactivateTier,
  reorderTiers,
  type Tier,
  type TierInput,
} from '../../lib/community/tiers';
import {
  startOrSwitchTier,
  cancelMembership,
  type StartTierResult,
} from '../../lib/billing/member-subscription';

async function requireUser(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');
  return user.id;
}

async function revalidateMonetization(communityId: string): Promise<void> {
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/settings/monetization`);
}

// ─── Connect onboarding ───────────────────────────────────────────────────────

// Returns a union instead of throwing — thrown Server Action errors are
// masked into opaque digests in production, which is exactly the raw-error
// experience we never want a creator to see.
export async function startPayoutOnboarding(
  communityId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const userId = await requireUser();
    const { url } = await startConnectOnboarding(communityId, userId);
    return { ok: true, url };
  } catch (err) {
    console.error('[startPayoutOnboarding]', err);
    const raw = err instanceof Error ? err.message : '';
    if (/platform.profile|responsibilit|review the responsibilities/i.test(raw)) {
      return {
        ok: false,
        error: 'Stripe needs a one-time platform setup first — open your Stripe dashboard → Settings → Connect and complete the platform profile, then try again.',
      };
    }
    if (raw.startsWith('[gild]')) {
      return { ok: false, error: raw.replace('[gild] ', '') };
    }
    return { ok: false, error: 'We couldn’t reach Stripe just now. Please try again in a minute.' };
  }
}

export async function refreshPayoutStatus(communityId: string): Promise<ConnectStatus> {
  await requireUser();
  const status = await refreshConnectStatus(communityId);
  await revalidateMonetization(communityId);
  return status;
}

// ─── Tier management ──────────────────────────────────────────────────────────

export async function createTierAction(communityId: string, input: TierInput): Promise<Tier> {
  const userId = await requireUser();
  const tier = await createTier(communityId, userId, input);
  await revalidateMonetization(communityId);
  return tier;
}

export async function updateTierAction(
  tierId: string,
  communityId: string,
  input: TierInput,
): Promise<Tier> {
  const userId = await requireUser();
  const tier = await updateTier(tierId, communityId, userId, input);
  await revalidateMonetization(communityId);
  return tier;
}

export async function deactivateTierAction(tierId: string, communityId: string): Promise<void> {
  const userId = await requireUser();
  await deactivateTier(tierId, communityId, userId);
  await revalidateMonetization(communityId);
}

export async function reorderTiersAction(
  communityId: string,
  orderedActiveIds: string[],
): Promise<void> {
  const userId = await requireUser();
  await reorderTiers(communityId, userId, orderedActiveIds);
  await revalidateMonetization(communityId);
}

// ─── Member checkout ──────────────────────────────────────────────────────────

// Subscribes the member to a tier, or switches their existing subscription.
// Returns either a Checkout URL (new subscription) or a "switched" result
// (existing subscription's price was swapped in place — no redirect needed).
export async function startTierCheckout(
  communityId: string,
  tierId: string,
  returnPath: string,
): Promise<StartTierResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');
  if (!user.email) throw new Error('[gild] your account has no email address');
  const result = await startOrSwitchTier(communityId, tierId, user.id, user.email, returnPath);
  if (result.kind === 'switched') {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}/membership`);
  }
  return result;
}

// Cancels the member's subscription at period end. Returns when access ends.
export async function cancelMembershipAction(
  communityId: string,
): Promise<{ endsAt: string | null }> {
  const userId = await requireUser();
  const result = await cancelMembership(communityId, userId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/membership`);
  return result;
}
