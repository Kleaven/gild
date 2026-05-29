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
const targetTypeSchema = z.enum(['community', 'platform']);

export async function createCheckoutSession(
  targetId: string,
  plan: Plan,
  targetType: 'community' | 'platform' = 'community',
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const validatedContext = returnContextSchema.parse(returnContext);
  const validatedType = targetTypeSchema.parse(targetType);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  // Verify ownership/authorization
  if (validatedType === 'community') {
    const { data: isOwner } = await supabase.rpc('is_community_owner', {
      p_community_id: targetId,
    });
    if (!isOwner) throw new Error('[gild] not authorized');
  } else {
    if (targetId !== user.id) throw new Error('[gild] not authorized');
  }

  const ownerEmail = user.email ?? '';
  return libCreateCheckoutSession(targetId, plan, ownerEmail, validatedType, validatedContext);
}

export async function createBillingPortalSession(
  targetId: string,
  targetType: 'community' | 'platform' = 'community',
  returnContext: CheckoutReturnContext = 'settings',
): Promise<{ url: string }> {
  const validatedType = targetTypeSchema.parse(targetType);
  const validatedContext = returnContextSchema.parse(returnContext);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  if (validatedType === 'community') {
    const { data: isOwner } = await supabase.rpc('is_community_owner', {
      p_community_id: targetId,
    });
    if (!isOwner) throw new Error('[gild] not authorized');
  } else {
    if (targetId !== user.id) throw new Error('[gild] not authorized');
  }

  return libCreateBillingPortalSession(targetId, validatedType, validatedContext);
}

export async function cancelSubscription(
  targetId: string,
  targetType: 'community' | 'platform' = 'community',
): Promise<void> {
  const validatedType = targetTypeSchema.parse(targetType);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  if (validatedType === 'community') {
    const { data: isOwner } = await supabase.rpc('is_community_owner', {
      p_community_id: targetId,
    });
    if (!isOwner) throw new Error('[gild] not authorized');
  } else {
    if (targetId !== user.id) throw new Error('[gild] not authorized');
  }

  await libCancelSubscription(targetId, validatedType);

  if (validatedType === 'community') {
    const slug = await resolveCommunitySlug(targetId);
    revalidatePath(`/c/${slug}/settings`);
  } else {
    revalidatePath(`/settings/billing`);
  }
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
