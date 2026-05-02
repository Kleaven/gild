// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import {
  decodeCursor,
  encodeCursor,
  getKeysetFilterAsc,
  type CursorInput,
  type PaginatedResult,
} from '../pagination/cursor';
import type { Community, CommunityMember, MemberProfile, MembershipTier } from './types';

const DEFAULT_LIMIT = 20;

export async function getCommunity(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<Community | null> {
  const { data } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

export async function getCommunityBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<Community | null> {
  const { data } = await supabase
    .from('communities')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

export async function getCommunityMembers(
  supabase: SupabaseClient<Database>,
  communityId: string,
  cursor: CursorInput,
): Promise<PaginatedResult<MemberProfile>> {
  const limit = cursor.limit ?? DEFAULT_LIMIT;

  // Server-verified user ID — explicit membership check before listing members.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { data: [], nextCursor: null };

  // Two-policy SELECT: confirm caller is a non-banned member.
  const { data: callerMembership } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .neq('role', 'banned')
    .maybeSingle();
  if (!callerMembership) return { data: [], nextCursor: null };

  let query = supabase
    .from('community_members')
    .select('id, user_id, role, joined_at, profiles(display_name, avatar_url, username)')
    .eq('community_id', communityId)
    .neq('role', 'banned')
    .order('joined_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor.cursor) {
    const payload = decodeCursor<{ t: string; id: string }>(cursor.cursor);
    if (payload) {
      query = query.or(getKeysetFilterAsc('joined_at', payload.t, payload.id));
    }
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  type ProfileShape = { display_name: string; avatar_url: string | null; username: string | null };
  type RowShape = {
    id: string;
    user_id: string;
    role: Database['public']['Enums']['member_role'];
    joined_at: string;
    profiles: ProfileShape | null;
  };

  const members: MemberProfile[] = (rows as unknown as RowShape[]).map((r) => ({
    user_id: r.user_id,
    role: r.role,
    joined_at: r.joined_at,
    display_name: r.profiles?.display_name ?? '',
    avatar_url: r.profiles?.avatar_url ?? null,
    username: r.profiles?.username ?? null,
  }));

  let nextCursor: string | null = null;
  if ((rows?.length ?? 0) === limit) {
    const last = (rows as unknown as RowShape[])[rows!.length - 1];
    if (last) nextCursor = encodeCursor({ t: last.joined_at, id: last.id });
  }

  return { data: members, nextCursor };
}

export async function getMembership(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<CommunityMember | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('community_members')
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .maybeSingle();
  return data;
}

export async function getMembershipTiers(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<MembershipTier[]> {
  const { data } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('community_id', communityId)
    .order('price_month_usd', { ascending: true });
  return data ?? [];
}
