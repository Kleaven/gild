'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { checkRateLimit } from '../rate-limit/index';
import type { CreateCommunityInput, UpdateMemberRoleInput } from './types';

const createCommunitySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(500).optional(),
});

const updateMemberRoleSchema = z.object({
  communityId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  newRole: z.enum(['admin', 'moderator', 'tier2_member', 'tier1_member', 'free_member', 'banned']),
});

export async function createCommunity(
  input: CreateCommunityInput,
): Promise<{ communityId: string }> {
  const parsed = createCommunitySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { name, slug, description } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await checkRateLimit(user.id, 'community_create', 5, 3600);
  if (!rl.allowed) throw new Error('[gild] rate limit exceeded');

  const { data: communityId, error } = await supabase.rpc('create_community', {
    p_name: name,
    p_slug: slug,
    p_description: description,
  });
  if (error) throw new Error(error.message);

  return { communityId: communityId as string };
}

export async function joinCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('join_community', {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('leave_community', {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
}

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { communityId, targetUserId, newRole } = parsed.data;

  const supabase = await getSupabaseServerClient();

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] insufficient permissions to update member role');

  const { error } = await supabase.rpc('update_member_role', {
    p_community_id: communityId,
    p_user_id: targetUserId,
    p_new_role: newRole,
  });
  if (error) throw new Error(error.message);
}

export async function transferOwnership(
  communityId: string,
  newOwnerId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { data: isOwner, error: ownerError } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (ownerError) throw new Error(ownerError.message);
  if (!isOwner) throw new Error('[gild] only the community owner can transfer ownership');

  const { error } = await supabase.rpc('transfer_community_ownership', {
    p_community_id: communityId,
    p_new_owner_id: newOwnerId,
  });
  if (error) throw new Error(error.message);
}
