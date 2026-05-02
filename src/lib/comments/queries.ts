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
import type { CommentNode } from './types';

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

async function fetchReplyCounts(
  supabase: SupabaseClient<Database>,
  commentIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (commentIds.length === 0) return map;
  const { data } = await supabase
    .from('comments')
    .select('parent_id')
    .in('parent_id', commentIds)
    .is('deleted_at', null);
  (data ?? []).forEach((r) => {
    if (r.parent_id) {
      map.set(r.parent_id, (map.get(r.parent_id) ?? 0) + 1);
    }
  });
  return map;
}

export async function getComments(
  supabase: SupabaseClient<Database>,
  postId: string,
  cursor: CursorInput,
): Promise<PaginatedResult<CommentNode>> {
  const limit = cursor.limit ?? DEFAULT_LIMIT;

  // Two-policy SELECT: RLS on comments checks is_community_member via community_id.
  let query = supabase
    .from('comments')
    .select('*, author:profiles!author_id(display_name, avatar_url)')
    .eq('post_id', postId)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor.cursor) {
    const payload = decodeCursor<{ t: string; id: string }>(cursor.cursor);
    if (payload) {
      query = query.or(getKeysetFilterAsc('created_at', payload.t, payload.id));
    }
  }

  const { data: rawComments, error } = await query;
  if (error) throw new Error(error.message);

  const comments = rawComments ?? [];
  const commentIds = comments.map((c) => c.id);

  const [votedIds, replyCountMap] = await Promise.all([
    fetchVotedSet(supabase, commentIds, 'comment'),
    fetchReplyCounts(supabase, commentIds),
  ]);

  const nodes = comments.map((comment) => ({
    ...comment,
    reply_count: replyCountMap.get(comment.id) ?? 0,
    viewer_has_voted: votedIds.has(comment.id),
  })) as CommentNode[];

  let nextCursor: string | null = null;
  if (comments.length === limit) {
    const last = comments[comments.length - 1];
    if (last) {
      nextCursor = encodeCursor({ t: last.created_at, id: last.id });
    }
  }

  return { data: nodes, nextCursor };
}

export async function getReplies(
  supabase: SupabaseClient<Database>,
  parentCommentId: string,
  cursor: CursorInput,
): Promise<PaginatedResult<CommentNode>> {
  const limit = cursor.limit ?? DEFAULT_LIMIT;

  // Two-policy SELECT: RLS on comments checks is_community_member via community_id.
  let query = supabase
    .from('comments')
    .select('*, author:profiles!author_id(display_name, avatar_url)')
    .eq('parent_id', parentCommentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);

  if (cursor.cursor) {
    const payload = decodeCursor<{ t: string; id: string }>(cursor.cursor);
    if (payload) {
      query = query.or(getKeysetFilterAsc('created_at', payload.t, payload.id));
    }
  }

  const { data: rawReplies, error } = await query;
  if (error) throw new Error(error.message);

  const replies = rawReplies ?? [];
  const replyIds = replies.map((r) => r.id);

  const votedIds = await fetchVotedSet(supabase, replyIds, 'comment');

  const nodes = replies.map((reply) => ({
    ...reply,
    reply_count: 0,
    viewer_has_voted: votedIds.has(reply.id),
  })) as CommentNode[];

  let nextCursor: string | null = null;
  if (replies.length === limit) {
    const last = replies[replies.length - 1];
    if (last) {
      nextCursor = encodeCursor({ t: last.created_at, id: last.id });
    }
  }

  return { data: nodes, nextCursor };
}
