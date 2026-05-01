import { createClient } from '@/lib/supabase/server';
import { decodeCursor, encodeCursor, getKeysetFilter } from '../pagination/cursor';
import type { Database } from '../supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];

export interface FeedResult {
  posts: Post[];
  nextCursor: string | null;
}

/**
 * Fetches the "Hot" feed for a community.
 * Sorted by: hot_score DESC, id DESC
 */
export async function getHotPosts(
  communityId: string,
  limit: number = 20,
  cursor?: string
): Promise<FeedResult> {
  const supabase = await createClient();
  
  let query = supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('hot_score', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (cursor) {
    const payload = decodeCursor<{ s: number; id: string }>(cursor);
    if (payload) {
      query = query.or(getKeysetFilter('hot_score', payload.s, payload.id));
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  const posts = data || [];
  let nextCursor: string | null = null;

  if (posts.length === limit) {
    const last = posts[posts.length - 1];
    if (last) {
      nextCursor = encodeCursor({ s: last.hot_score, id: last.id });
    }
  }

  return { posts, nextCursor };
}

/**
 * Fetches the "New" feed for a community.
 * Sorted by: created_at DESC, id DESC
 */
export async function getNewPosts(
  communityId: string,
  limit: number = 20,
  cursor?: string
): Promise<FeedResult> {
  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (cursor) {
    const payload = decodeCursor<{ t: string; id: string }>(cursor);
    if (payload) {
      query = query.or(getKeysetFilter('created_at', payload.t, payload.id));
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  const posts = data || [];
  let nextCursor: string | null = null;

  if (posts.length === limit) {
    const last = posts[posts.length - 1];
    if (last) {
      nextCursor = encodeCursor({ t: last.created_at, id: last.id });
    }
  }

  return { posts, nextCursor };
}

/**
 * Fetches the "Top" feed for a community.
 * Sorted by: like_count DESC, id DESC
 */
export async function getTopPosts(
  communityId: string,
  timeframe: 'day' | 'week' | 'month' | 'all' = 'all',
  limit: number = 20,
  cursor?: string
): Promise<FeedResult> {
  const supabase = await createClient();

  let query = supabase
    .from('posts')
    .select('*')
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('like_count', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  // Apply time filter
  if (timeframe !== 'all') {
    const now = new Date();
    if (timeframe === 'day') now.setDate(now.getDate() - 1);
    if (timeframe === 'week') now.setDate(now.getDate() - 7);
    if (timeframe === 'month') now.setMonth(now.getMonth() - 1);
    query = query.gte('created_at', now.toISOString());
  }

  if (cursor) {
    const payload = decodeCursor<{ l: number; id: string }>(cursor);
    if (payload) {
      query = query.or(getKeysetFilter('like_count', payload.l, payload.id));
    }
  }

  const { data, error } = await query;

  if (error) throw error;

  const posts = data || [];
  let nextCursor: string | null = null;

  if (posts.length === limit) {
    const last = posts[posts.length - 1];
    if (last) {
      nextCursor = encodeCursor({ l: last.like_count, id: last.id });
    }
  }

  return { posts, nextCursor };
}
