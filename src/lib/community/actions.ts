'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { checkRateLimit } from '../rate-limit/index';
import { getMemberLimit } from '../billing/gates';
import type { CreateCommunityInput, UpdateMemberRoleInput } from './types';

const createCommunitySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^(?=.*[a-z0-9])[a-z0-9-]+$/, 'slug must contain letters or numbers and use hyphens only'),
  description: z.string().max(500).optional(),
  is_private: z.boolean().optional().default(false),
  category: z.string().optional(),
  theme_hue: z.number().min(0).max(360).optional(),
  welcome_message: z.string().max(2000).optional(),
  goodbye_message: z.string().max(2000).optional(),
  pricing_type: z.enum(['free', 'paid']).optional().default('free'),
  price_amount: z.number().min(0).optional().default(0),
  price_currency: z.string().optional().default('USD'),
  pricing_period: z.enum(['one_time', 'monthly', 'yearly']).optional().default('one_time'),
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
  const { name, slug, description, is_private, category, theme_hue, welcome_message, goodbye_message, pricing_type, price_amount, price_currency, pricing_period } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await checkRateLimit(user.id, 'community_create', 5, 3600);
  if (!rl.allowed) throw new Error('[gild] rate limit exceeded');

  // Paywall Check
  const { data: hasSubscription } = await supabase.rpc('has_platform_subscription', {
    p_user_id: user.id
  });
  if (!hasSubscription) throw new Error('A valid Gild subscription is required to create a community.');

  const { data: communityId, error } = await supabase.rpc('create_community', {
    p_name: name,
    p_slug: slug,
    p_description: description,
    p_is_private: is_private,
    p_category: category,
    p_theme_hue: theme_hue,
    p_welcome_message: welcome_message,
    p_goodbye_message: goodbye_message,
    p_pricing_type: pricing_type,
    p_price_amount: price_amount,
    p_price_currency: price_currency,
    p_pricing_period: pricing_period,
  });
  if (error) {
    if (error.message.includes('duplicate key value violates unique constraint')) {
      throw new Error('This URL slug is already taken. Please choose another.');
    }
    throw new Error(error.message);
  }

  return { communityId: communityId as string };
}

export async function joinCommunity(communityId: string): Promise<{ welcome_message: string | null; name: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: communityData, error: fetchError } = await supabase
    .from('communities')
    .select('plan, member_count')
    .eq('id', communityId)
    .single();
  
  if (fetchError || !communityData) throw new Error('[gild] community not found');
  
  const limit = getMemberLimit(communityData.plan as any);
  if (communityData.member_count >= limit) {
    throw new Error(`This community has reached its member limit of ${limit} for the current plan.`);
  }

  const { data, error } = await supabase.rpc('join_community', {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);

  const { data: community } = await supabase
    .from('communities')
    .select('name, welcome_message')
    .eq('id', communityId)
    .single();

  return { 
    welcome_message: community?.welcome_message ?? null,
    name: community?.name ?? 'Community'
  };
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

export async function updateCommunity(
  communityId: string,
  input: { 
    name?: string; 
    description?: string; 
    theme_hue?: number; 
    logo_url?: string; 
    banner_url?: string; 
    is_private?: boolean; 
    category?: string;
    role_permissions?: any;
    welcome_message?: string;
    goodbye_message?: string;
  },
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from('communities')
    .update({
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.theme_hue !== undefined && { theme_hue: input.theme_hue }),
      ...(input.logo_url !== undefined && { logo_url: input.logo_url }),
      ...(input.banner_url !== undefined && { banner_url: input.banner_url }),
      ...(input.is_private !== undefined && { is_private: input.is_private }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.role_permissions !== undefined && { role_permissions: input.role_permissions }),
      ...(input.welcome_message !== undefined && { welcome_message: input.welcome_message }),
      ...(input.goodbye_message !== undefined && { goodbye_message: input.goodbye_message }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', communityId);

  if (error) throw new Error(error.message);
}

export async function deleteCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from('communities')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', communityId);

  if (error) throw new Error(error.message);
}
