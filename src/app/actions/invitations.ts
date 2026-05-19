'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { resolveCommunitySlug } from '@/lib/community/context';

const createSchema = z.object({
  communityId: z.string().uuid(),
  // null = unlimited uses. Cap at 1000 to prevent silly numbers.
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
  // null = never expires. Cap at 1 year for hygiene.
  expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
});

export type SharedInviteLink = {
  id: string;
  token: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
};

export type CreateInviteLinkResult =
  | { ok: true; link: SharedInviteLink }
  | { ok: false; code: 'validation_failed' | 'insufficient_permissions'; message: string };

/**
 * Create a shared invite link for a community. RLS on
 * community_invite_links.INSERT (set up in 20260518000001) already
 * restricts to admin+ — the app-layer check is defense-in-depth.
 */
export async function createSharedInviteLink(
  input: { communityId: string; maxUses?: number | null; expiresInDays?: number | null },
): Promise<CreateInviteLinkResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: 'validation_failed', message: 'Invalid input' };
  }
  const { communityId, maxUses, expiresInDays } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, code: 'insufficient_permissions', message: 'Not authenticated' };
  }

  const { data: isAdmin, error: roleErr } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleErr) throw new Error(roleErr.message);
  if (!isAdmin) {
    return {
      ok: false,
      code: 'insufficient_permissions',
      message: 'Only community admins or the owner can create invite links.',
    };
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('community_invite_links')
    .insert({
      community_id: communityId,
      creator_id: user.id,
      max_uses: maxUses ?? null,
      expires_at: expiresAt,
    })
    .select('id, token, max_uses, uses, expires_at, created_at')
    .single();

  if (error) {
    if (error.message.includes('row-level security')) {
      return {
        ok: false,
        code: 'insufficient_permissions',
        message: 'You do not have permission to create invite links.',
      };
    }
    throw new Error(error.message);
  }

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
  return { ok: true, link: data as SharedInviteLink };
}

/**
 * List active shared invite links for a community. RLS restricts to
 * admin+ so non-admin callers get an empty array.
 */
export async function listSharedInviteLinks(
  communityId: string,
): Promise<{ ok: boolean; links?: SharedInviteLink[]; error?: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('community_invite_links')
    .select('id, token, max_uses, uses, expires_at, created_at')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { ok: false, error: error.message };
  return { ok: true, links: (data ?? []) as SharedInviteLink[] };
}

/**
 * Revoke (DELETE) a shared invite link. RLS already restricts to admin+
 * of the link's community.
 */
export async function revokeSharedInviteLink(
  linkId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!z.string().uuid().safeParse(linkId).success) {
    return { ok: false, error: 'Invalid link id' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Not authenticated' };

  // Resolve the community for revalidation BEFORE the delete (the row
  // disappears after).
  const { data: row } = await supabase
    .from('community_invite_links')
    .select('community_id')
    .eq('id', linkId)
    .maybeSingle();

  const { error } = await supabase
    .from('community_invite_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    if (error.message.includes('row-level security')) {
      return { ok: false, error: 'You do not have permission to revoke this link.' };
    }
    return { ok: false, error: error.message };
  }

  if (row?.community_id) {
    const slug = await resolveCommunitySlug(row.community_id);
    revalidatePath(`/c/${slug}`);
  }
  return { ok: true };
}
