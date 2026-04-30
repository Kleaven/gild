// server-only — do not import from client components
import { getSupabaseServerClient } from '../auth/server';
import { hasMinRole, type MemberRole } from './roles';
import type { AuthResult } from '../auth/types';

export async function getUserCommunityRole(
  userId: string,
  communityId: string,
): Promise<MemberRole | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('community_members')
    .select('role')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .maybeSingle();

  return (data?.role as MemberRole) ?? null;
}

export async function assertMinRole(
  userId: string,
  communityId: string,
  minRole: MemberRole,
): Promise<AuthResult<{ role: MemberRole }>> {
  const role = await getUserCommunityRole(userId, communityId);

  if (role === null) {
    return {
      data: null,
      error: { code: 'USER_NOT_FOUND', message: 'Not a member of this community' },
    };
  }

  if (!hasMinRole(role, minRole)) {
    return {
      data: null,
      error: { code: 'UNKNOWN', message: 'Insufficient permissions' },
    };
  }

  return { data: { role }, error: null };
}

export async function isCommunityOwner(
  userId: string,
  communityId: string,
): Promise<boolean> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('communities')
    .select('id')
    .eq('id', communityId)
    .eq('owner_id', userId)
    .maybeSingle();

  return data !== null;
}

export async function getCommunityVisibility(
  communityId: string,
): Promise<'public' | 'private' | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('communities')
    .select('is_private')
    .eq('id', communityId)
    .maybeSingle();

  if (data === null) return null;
  return data.is_private ? 'private' : 'public';
}
