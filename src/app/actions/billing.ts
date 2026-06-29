'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { resolveCommunitySlug } from '../../lib/community/context';
import {
  createCheckoutSession as libCreateCheckoutSession,
  createBillingPortalSession as libCreateBillingPortalSession,
  cancelSubscription as libCancelSubscription,
} from '../../lib/billing/subscription';
import type { CheckoutReturnContext } from '../../lib/billing/subscription';
import type { Plan } from '../../lib/billing/plans';

const returnContextSchema = z.enum(['settings', 'onboarding', 'global', 'billing']);

// Pro is a per-community subscription — there is no account-level plan. Every
// billing action is scoped to a community the caller owns.
async function requireCommunityOwner(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');
  const { data: isOwner } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (!isOwner) throw new Error('[gild] not authorized');
}

export async function createCheckoutSession(
  communityId: string,
  plan: Plan,
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const validatedContext = returnContextSchema.parse(returnContext);
  await requireCommunityOwner(communityId);

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ownerEmail = user?.email ?? '';
  return libCreateCheckoutSession(communityId, plan, ownerEmail, validatedContext);
}

export async function createBillingPortalSession(
  communityId: string,
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const validatedContext = returnContextSchema.parse(returnContext);
  await requireCommunityOwner(communityId);
  return libCreateBillingPortalSession(communityId, validatedContext);
}

export async function cancelSubscription(communityId: string): Promise<void> {
  await requireCommunityOwner(communityId);
  await libCancelSubscription(communityId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/settings`);
}

export async function createCommunityJoinSession(
  communityId: string,
): Promise<{ url: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const { createCommunityJoinSession: libCreateJoin } = await import('../../lib/billing/subscription');
  return libCreateJoin(communityId, user.id, user.email ?? '');
}
