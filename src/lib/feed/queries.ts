// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import {
  decodeCursor,
  encodeCursor,
  getKeysetFilter,
  type CursorInput,
  type PaginatedResult,
} from '../pagination/cursor';
import type { FeedPost } from './types';

const DEFAULT_LIMIT = 20;

async function fetchVotedSet(
  supabase: SupabaseClient<Database>,
  targetIds: string[],
  targetType: 'post' | 'comment',
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const { data } = await supabase
    .from('votes')
    .select('target_id')
    .eq('target_type', targetType)
    .in('target_id', targetIds);
  const set = new Set<string>();
  (data ?? []).forEach((v) => set.add(v.target_id));
  return set;
}

export async function getFeedPosts(
  supabase: SupabaseClient<Database>,
  communityId: string,
  spaceId: string | null,
  cursor: CursorInput,
): Promise<PaginatedResult<FeedPost>> {
  const limit = cursor.limit ?? DEFAULT_LIMIT;

  // Two-policy SELECT: RLS on posts checks is_community_member via spaces join;
  // RLS on spaces checks is_community_member directly. Both fire on this query.
  let query = supabase
    .from('posts')
    .select(
      '*, author:profiles!author_id(display_name, avatar_url), space:spaces!space_id(name, type)',
    )
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('hot_score', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (spaceId !== null) {
    query = query.eq('space_id', spaceId);
  }

  if (cursor.cursor) {
    const payload = decodeCursor<{ s: number; id: string }>(cursor.cursor);
    if (payload) {
      query = query.or(getKeysetFilter('hot_score', payload.s, payload.id));
    }
  }

  const { data: rawPosts, error } = await query;
  if (error) throw new Error(error.message);

  const posts = rawPosts ?? [];
  const votedIds = await fetchVotedSet(
    supabase,
    posts.map((p) => p.id),
    'post',
  );

  const feedPosts = posts.map((post) => ({
    ...post,
    viewer_has_voted: votedIds.has(post.id),
  })) as FeedPost[];

  let nextCursor: string | null = null;
  if (posts.length === limit) {
    const last = posts[posts.length - 1];
    if (last) {
      nextCursor = encodeCursor({ s: Number(last.hot_score), id: last.id });
    }
  }

  return { data: feedPosts, nextCursor };
}

export async function getPost(
  supabase: SupabaseClient<Database>,
  postId: string,
): Promise<FeedPost | null> {
  // Two-policy SELECT: same RLS chain as getFeedPosts.
  const { data: post, error } = await supabase
    .from('posts')
    .select(
      '*, author:profiles!author_id(display_name, avatar_url), space:spaces!space_id(name, type)',
    )
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!post) return null;

  const votedIds = await fetchVotedSet(supabase, [postId], 'post');

  return {
    ...post,
    viewer_has_voted: votedIds.has(postId),
  } as FeedPost;
}
