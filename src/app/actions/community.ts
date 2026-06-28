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
import {
  setCustomDomain as libSetCustomDomain,
  verifyCustomDomain as libVerifyCustomDomain,
  removeCustomDomain as libRemoveCustomDomain,
  type DomainResult,
} from '../../lib/community/domains';
import type { CreateCommunityResult, DeleteCommunityResult, JoinCommunityResult, UpdateCommunityInput, UpdateCommunityResult } from '../../lib/community/actions';
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

// Returns the lib's discriminated union as-is so the JoinGate / JoinButton
// can render an inline error (already a member, banned, private, etc.)
// instead of catching a thrown 500 with the message stripped.
// Cache invalidation only fires on the success branch.
// inviteToken is optional — when present, redeems a shared invite link
// (bypasses the private-community gate + increments the link's `uses`
// counter inside the join_community RPC). Public communities ignore it.
export async function joinCommunity(
  communityId: string,
  inviteToken?: string | null,
): Promise<JoinCommunityResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libJoinCommunity(communityId, inviteToken);

  if (result.ok) {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}`);
  }

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

// Removes a member from the community entirely ("kick"). Admin+ only (RLS
// enforces on DELETE); owners can never be kicked, and admins cannot kick
// fellow admins — mirrors the update_member_role guards.
export async function removeMember(
  communityId: string,
  targetUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, error: 'Not signed in.' };
  if (user.id === targetUserId) return { ok: false, error: 'You can’t remove yourself — use Leave Community.' };

  const [{ data: callerRole }, { data: target }] = await Promise.all([
    supabase.rpc('current_user_role', { p_community_id: communityId }),
    supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', targetUserId)
      .maybeSingle(),
  ]);
  if (!target) return { ok: false, error: 'That member was not found.' };
  if (target.role === 'owner') return { ok: false, error: 'The owner can’t be removed.' };
  if (callerRole !== 'owner' && target.role === 'admin') {
    return { ok: false, error: 'Only the owner can remove an admin.' };
  }

  const { error: delError } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', targetUserId);
  if (delError) {
    console.error('[removeMember]', delError.message);
    return { ok: false, error: 'Couldn’t remove the member. Please try again.' };
  }

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/members`);
  return { ok: true };
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

// Returns the lib's discriminated union as-is so the settings save flow
// can render an inline "validation failed" or "only the owner can update"
// chip instead of catching a thrown 500 with the message stripped.
// Cache invalidation only fires on the success branch.
export async function updateCommunity(
  communityId: string,
  input: UpdateCommunityInput,
): Promise<UpdateCommunityResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libUpdateCommunity(communityId, input);

  if (result.ok) {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}`);
    revalidatePath(`/c/${slug}/settings`);
  }

  return result;
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

// ─── Custom domain (Pro) ─────────────────────────────────────────────────────
// All three delegate owner + Pro gating to the lib (which re-proves it against
// the DB row); these wrappers only handle the session check + revalidation.
export async function setCommunityDomain(
  communityId: string,
  domain: string,
): Promise<DomainResult> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const result = await libSetCustomDomain(communityId, user.id, domain);
  if (result.ok) {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}/settings`);
  }
  return result;
}

export async function verifyCommunityDomain(communityId: string): Promise<DomainResult> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const result = await libVerifyCustomDomain(communityId, user.id);
  if (result.ok) {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}/settings`);
  }
  return result;
}

export async function removeCommunityDomain(communityId: string): Promise<DomainResult> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const result = await libRemoveCustomDomain(communityId, user.id);
  if (result.ok) {
    const slug = await resolveCommunitySlug(communityId);
    revalidatePath(`/c/${slug}/settings`);
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

  // Update community with new asset URL. libUpdateCommunity now returns
  // a discriminated union; translate failures back into this function's
  // existing { ok, error } shape so callers (CustomizeClient) don't need
  // to change.
  const updateInput = type === 'logo' ? { logo_url: publicUrl } : { banner_url: publicUrl };
  const updateResult = await libUpdateCommunity(communityId, updateInput);
  if (!updateResult.ok) {
    return { ok: false, error: updateResult.message };
  }

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/c/${slug}/settings`);

  return { ok: true, url: publicUrl };
}
