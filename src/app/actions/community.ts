'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { resolveCommunitySlug } from '../../lib/community/context';
import {
  createCommunity as libCreateCommunity,
  joinCommunity as libJoinCommunity,
  leaveCommunity as libLeaveCommunity,
  updateMemberRole as libUpdateMemberRole,
  transferOwnership as libTransferOwnership,
  updateCommunity as libUpdateCommunity,
  deleteCommunity as libDeleteCommunity,
} from '../../lib/community/actions';
import type { CreateCommunityResult, DeleteCommunityResult, UpdateCommunityInput } from '../../lib/community/actions';
import type { CreateCommunityInput, UpdateMemberRoleInput } from '../../lib/community/types';

// Returns the lib's discriminated union as-is so the form can render a
// paywall/slug-taken CTA inline instead of catching a thrown 500.
// Cache invalidation only fires on the success branch.
export async function createCommunity(
  input: CreateCommunityInput,
): Promise<CreateCommunityResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libCreateCommunity(input);

  if (result.ok) {
    revalidatePath('/');
    revalidatePath('/communities');
  }

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

// Input is validated by libUpdateCommunity's Zod schema (UpdateCommunityInput).
// The lib also re-checks the executor's role server-side before touching
// the DB — this wrapper just confirms session presence and revalidates the
// slug-keyed cache paths after a successful update.
export async function updateCommunity(
  communityId: string,
  input: UpdateCommunityInput,
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

// Owner-only soft delete. libDeleteCommunity re-proves the role server-side
// via user_has_min_role('owner') before mutating; this wrapper handles the
// session check, propagates the lib's discriminated union as-is so the
// settings page can render an inline "insufficient permissions" message,
// and invalidates the community route + global listings on success only.
export async function deleteCommunity(communityId: string): Promise<DeleteCommunityResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  // Resolve the slug BEFORE deletion — once deleted_at is set, the row
  // becomes invisible to this client (queries filter is('deleted_at', null)).
  const slug = await resolveCommunitySlug(communityId);

  const result = await libDeleteCommunity(communityId);

  if (result.ok) {
    revalidatePath('/');
    revalidatePath('/communities');
    revalidatePath(`/c/${slug}`);
  }

  return result;
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
