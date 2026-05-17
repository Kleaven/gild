'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createCommunity as libCreateCommunity,
  joinCommunity as libJoinCommunity,
  leaveCommunity as libLeaveCommunity,
  updateMemberRole as libUpdateMemberRole,
  transferOwnership as libTransferOwnership,
  updateCommunity as libUpdateCommunity,
  deleteCommunity as libDeleteCommunity,
} from '../../lib/community/actions';
import type { CreateCommunityInput, UpdateMemberRoleInput } from '../../lib/community/types';

async function resolveCommunitySlug(communityId: string): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .single();
  return data?.slug ?? communityId;
}

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

export async function joinCommunity(communityId: string): Promise<{ welcome_message: string | null; name: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libJoinCommunity(communityId);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
  return result;
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libLeaveCommunity(communityId);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
}

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libUpdateMemberRole(input);

  const slug = await resolveCommunitySlug(input.communityId);
  revalidatePath(`/c/${slug}/members`);
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

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/settings`);
}

export async function updateCommunity(
  communityId: string,
  input: { name?: string; description?: string; theme_hue?: number; logo_url?: string; banner_url?: string; is_private?: boolean; category?: string },
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libUpdateCommunity(communityId, input);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/c/${slug}/settings`);
}

export async function deleteCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libDeleteCommunity(communityId);

  revalidatePath('/');
  revalidatePath('/communities');
}

export async function uploadCommunityAsset(
  communityId: string,
  formData: FormData,
  type: 'logo' | 'banner'
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const file = formData.get('file') as File;
  if (!file) return { ok: false, error: 'No file provided' };

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${communityId}/${type}-${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('branding')
    .upload(filePath, file);

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('branding')
    .getPublicUrl(filePath);

  // Update community with new asset URL
  const updateInput = type === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl };
  await libUpdateCommunity(communityId, updateInput);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/c/${slug}/settings`);

  return { ok: true, url: publicUrl };
}
