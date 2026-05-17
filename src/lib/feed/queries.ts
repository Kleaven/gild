// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import db from '../db';
import {
  decodeCursor,
  encodeCursor,
  getKeysetFilter,
  type CursorInput,
  type PaginatedResult,
} from '../pagination/cursor';
import type { FeedPost } from './types';

// ─── Broadcast status ────────────────────────────────────────────────────────
// Per-post counts of COMMUNITY_BROADCAST rows in email_queue. Caller is
// responsible for the auth check — this helper bypasses RLS via the
// postgres-js client because email_queue SELECT is platform-admin only.
// Returns null when no broadcast rows exist for the post (UI hides the badge).

export type BroadcastStatus = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
};

export async function getBroadcastStatus(postId: string): Promise<BroadcastStatus | null> {
  const rows = await db<{
    pending: string;
    sent: string;
    failed: string;
    cancelled: string;
  }[]>`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')   AS pending,
      COUNT(*) FILTER (WHERE status = 'sent')      AS sent,
      COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
    FROM public.email_queue
    WHERE template = 'COMMUNITY_BROADCAST'
      AND variables->>'postId' = ${postId}
  `;
  const r = rows[0];
  if (!r) return null;

  const pending = Number(r.pending) || 0;
  const sent = Number(r.sent) || 0;
  const failed = Number(r.failed) || 0;
  const cancelled = Number(r.cancelled) || 0;
  const total = pending + sent + failed + cancelled;
  if (total === 0) return null;

  return { total, pending, sent, failed, cancelled };
}

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

async function fetchPollData(
  supabase: SupabaseClient<Database>,
  postIds: string[],
): Promise<{ results: Record<string, Record<string, number>>; viewerVotes: Record<string, string> }> {
  if (postIds.length === 0) return { results: {}, viewerVotes: {} };

  const { data: votes } = await supabase
    .from('poll_votes')
    .select('post_id, option_id, user_id')
    .in('post_id', postIds);

  const results: Record<string, Record<string, number>> = {};
  const viewerVotes: Record<string, string> = {};
  const currentUserId = (await supabase.auth.getUser()).data.user?.id;

  (votes ?? []).forEach((v) => {
    if (!results[v.post_id]) results[v.post_id] = {};
    results[v.post_id][v.option_id] = (results[v.post_id][v.option_id] || 0) + 1;
    
    if (v.user_id === currentUserId) {
      viewerVotes[v.post_id] = v.option_id;
    }
  });

  return { results, viewerVotes };
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
  
  const { results: pollResults, viewerVotes: pollViewerVotes } = await fetchPollData(
    supabase,
    posts.map(p => p.id).filter(id => posts.find(p => p.id === id)?.type === 'poll')
  );

  const feedPosts = posts.map((post) => ({
    ...post,
    viewer_has_voted: votedIds.has(post.id),
    viewer_voted_option: pollViewerVotes[post.id] || null,
    poll_results: pollResults[post.id] || null,
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
  const { results, viewerVotes } = await fetchPollData(supabase, [postId]);

  return {
    ...post,
    viewer_has_voted: votedIds.has(postId),
    viewer_voted_option: viewerVotes[postId] || null,
    poll_results: results[postId] || null,
  } as FeedPost;
}
