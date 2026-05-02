// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import db from '../db';
import {
  decodeCursor,
  encodeCursor,
  type CursorInput,
  type PaginatedResult,
} from '../pagination/cursor';
import type { SearchPostResult, SearchCommunityResult, SearchMemberResult } from './types';

const DEFAULT_LIMIT = 20;

type PostSearchRow = {
  id: string;
  title: string | null;
  snippet: string;
  author_display_name: string | null;
  space_name: string;
  space_id: string;
  community_id: string;
  created_at: Date;
};

type CommunitySearchRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  member_count: number;
  is_private: boolean;
};

type MemberSearchRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
};

export async function searchPosts(
  supabase: SupabaseClient<Database>,
  communityId: string,
  query: string,
  cursor: CursorInput,
): Promise<PaginatedResult<SearchPostResult>> {
  const trimmed = query.trim();
  if (!trimmed) return { data: [], nextCursor: null };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const limit = cursor.limit ?? DEFAULT_LIMIT;
  const offset = decodeCursor<{ o: number }>(cursor.cursor)?.o ?? 0;

  // Two-policy SELECT: ts_rank + ts_headline require raw SQL; postgres-js used
  // directly. RLS is bypassed, so membership is enforced via EXISTS subquery.
  const rows = await db<PostSearchRow[]>`
    SELECT
      p.id,
      p.title,
      ts_headline(
        'simple',
        coalesce(p.body, ''),
        websearch_to_tsquery('simple', ${trimmed}),
        'MaxWords=35,MinWords=15,MaxFragments=1'
      )                        AS snippet,
      pr.display_name          AS author_display_name,
      s.name                   AS space_name,
      p.space_id,
      p.community_id,
      p.created_at
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.author_id
    JOIN  public.spaces   s  ON s.id  = p.space_id
    WHERE p.search_vector @@ websearch_to_tsquery('simple', ${trimmed})
      AND p.community_id  = ${communityId}
      AND p.deleted_at   IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.community_members cm
        WHERE cm.community_id = ${communityId}
          AND cm.user_id      = ${user.id}
          AND cm.role        <> 'banned'
      )
    ORDER BY ts_rank(p.search_vector, websearch_to_tsquery('simple', ${trimmed})) DESC,
             p.created_at DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  const data: SearchPostResult[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    author_display_name: r.author_display_name,
    space_name: r.space_name,
    space_id: r.space_id,
    community_id: r.community_id,
    created_at: r.created_at.toISOString(),
  }));

  const nextCursor = data.length === limit ? encodeCursor({ o: offset + limit }) : null;
  return { data, nextCursor };
}

export async function searchCommunities(
  _supabase: SupabaseClient<Database>,
  query: string,
  cursor: CursorInput,
): Promise<PaginatedResult<SearchCommunityResult>> {
  const trimmed = query.trim();
  if (!trimmed) return { data: [], nextCursor: null };

  const limit = cursor.limit ?? DEFAULT_LIMIT;
  const offset = decodeCursor<{ o: number }>(cursor.cursor)?.o ?? 0;

  // No membership gate — communities are discoverable.
  // search_vector confirmed on communities: using ts_rank ordering.
  const rows = await db<CommunitySearchRow[]>`
    SELECT
      c.id,
      c.slug,
      c.name,
      c.description,
      c.logo_url,
      c.member_count,
      c.is_private
    FROM public.communities c
    WHERE c.search_vector @@ websearch_to_tsquery('simple', ${trimmed})
      AND c.deleted_at IS NULL
    ORDER BY ts_rank(c.search_vector, websearch_to_tsquery('simple', ${trimmed})) DESC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  const data: SearchCommunityResult[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? null,
    logo_url: r.logo_url ?? null,
    member_count: r.member_count,
    is_private: r.is_private,
  }));

  const nextCursor = data.length === limit ? encodeCursor({ o: offset + limit }) : null;
  return { data, nextCursor };
}

export async function searchMembers(
  supabase: SupabaseClient<Database>,
  communityId: string,
  query: string,
  cursor: CursorInput,
): Promise<PaginatedResult<SearchMemberResult>> {
  const trimmed = query.trim();
  if (!trimmed) return { data: [], nextCursor: null };

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const limit = cursor.limit ?? DEFAULT_LIMIT;
  const offset = decodeCursor<{ o: number }>(cursor.cursor)?.o ?? 0;

  // Two-policy SELECT: JOIN to community_members enforces community scope +
  // banned exclusion. EXISTS subquery verifies the caller is also a member.
  // search_vector confirmed on profiles (display_name + bio + username): FTS used.
  const rows = await db<MemberSearchRow[]>`
    SELECT
      p.id,
      p.display_name,
      p.avatar_url,
      p.username
    FROM public.profiles p
    JOIN public.community_members cm
      ON  cm.user_id      = p.id
      AND cm.community_id = ${communityId}
      AND cm.role        <> 'banned'
    WHERE p.search_vector @@ websearch_to_tsquery('simple', ${trimmed})
      AND EXISTS (
        SELECT 1
        FROM public.community_members caller
        WHERE caller.community_id = ${communityId}
          AND caller.user_id      = ${user.id}
          AND caller.role        <> 'banned'
      )
    ORDER BY p.display_name ASC
    LIMIT  ${limit}
    OFFSET ${offset}
  `;

  const data: SearchMemberResult[] = rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    avatar_url: r.avatar_url ?? null,
    username: r.username ?? null,
  }));

  const nextCursor = data.length === limit ? encodeCursor({ o: offset + limit }) : null;
  return { data, nextCursor };
}
