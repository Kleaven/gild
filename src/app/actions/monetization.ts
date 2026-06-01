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
  type Tier,
  type TierInput,
} from '../../lib/community/tiers';

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

export async function startPayoutOnboarding(communityId: string): Promise<{ url: string }> {
  const userId = await requireUser();
  return startConnectOnboarding(communityId, userId);
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
