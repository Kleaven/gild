'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createCommunity as libCreateCommunity,
  joinCommunity as libJoinCommunity,
  leaveCommunity as libLeaveCommunity,
  updateMemberRole as libUpdateMemberRole,
  transferOwnership as libTransferOwnership,
} from '../../lib/community/actions';
import type { CreateCommunityInput, UpdateMemberRoleInput } from '../../lib/community/types';

export async function createCommunity(
  input: CreateCommunityInput,
): Promise<{ communityId: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libCreateCommunity(input);

  revalidatePath('/');
  revalidatePath('/communities');

  return result;
}

export async function joinCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libJoinCommunity(communityId);

  revalidatePath(`/c/${communityId}`);
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libLeaveCommunity(communityId);

  revalidatePath(`/c/${communityId}`);
}

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libUpdateMemberRole(input);

  revalidatePath(`/c/${input.communityId}/members`);
}

export async function transferOwnership(
  communityId: string,
  newOwnerId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libTransferOwnership(communityId, newOwnerId);

  revalidatePath(`/c/${communityId}/settings`);
}
