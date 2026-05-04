'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createCheckoutSession as libCreateCheckoutSession,
  createBillingPortalSession as libCreateBillingPortalSession,
  cancelSubscription as libCancelSubscription,
} from '../../lib/billing/subscription';
import type { Plan } from '../../lib/billing/plans';

export async function createCheckoutSession(
  communityId: string,
  plan: Plan,
  returnBasePath?: string,
): Promise<{ url: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const { data: isOwner } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (!isOwner) throw new Error('[gild] not authorized');

  // user.email comes from the verified JWT — not caller-supplied
  const ownerEmail = user.email ?? '';
  return libCreateCheckoutSession(communityId, plan, ownerEmail, returnBasePath);
}

export async function createBillingPortalSession(
  communityId: string,
): Promise<{ url: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const { data: isOwner } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (!isOwner) throw new Error('[gild] not authorized');

  return libCreateBillingPortalSession(communityId);
}

export async function cancelSubscription(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const { data: isOwner } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (!isOwner) throw new Error('[gild] not authorized');

  await libCancelSubscription(communityId);

  revalidatePath(`/c/${communityId}/settings`);
}
