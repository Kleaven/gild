// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import db from '../db';
import type { Conversation, DirectMessage, RecipientProfile } from './types';

const DEFAULT_LIMIT = 50;

/**
 * Loads the most recent N messages between the caller and `otherUserId`.
 *
 * Backed by the `get_dm_thread` SECURITY INVOKER RPC which uses
 * LEAST/GREATEST on (sender_id, receiver_id) — the same shape as the
 * idx_direct_messages_thread compound index — so the planner can walk
 * it as a single Index Scan rather than the previous two-direction
 * OR-scan + sort.
 *
 * RLS still applies (SECURITY INVOKER preserves the caller's auth
 * context). The RPC merely rewrites the query so the index is usable.
 *
 * Returned chronologically (oldest → newest) so the UI can append-render
 * without reversing — the RPC returns DESC for the LIMIT optimisation,
 * we flip it at the boundary.
 */
export async function getConversation(
  supabase: SupabaseClient<Database>,
  otherUserId: string,
  options: { limit?: number } = {},
): Promise<DirectMessage[]> {
  const limit = options.limit ?? DEFAULT_LIMIT;

  const { data, error } = await supabase.rpc('get_dm_thread', {
    p_other_user_id: otherUserId,
    p_limit: limit,
  });

  if (error) throw new Error(error.message);

  // Reverse to chronological order for append-render.
  return ((data ?? []) as DirectMessage[]).reverse();
}

/**
 * Minimal profile fetch for the recipient header (avatar + display name).
 * profiles.SELECT is public-read for authenticated users, so no auth gate
 * needed beyond the standard session check.
 */
export async function getRecipientProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RecipientProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * The caller's DM inbox: latest message per peer, unread counts, and one
 * shared community for context. Runs on postgres-js (bypasses RLS) — the
 * userId MUST come from the verified session, never from client input.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const rows = await db<Conversation[]>`
    WITH msgs AS (
      SELECT m.*,
             CASE WHEN m.sender_id = ${userId} THEN m.receiver_id ELSE m.sender_id END AS peer_id
      FROM public.direct_messages m
      WHERE m.sender_id = ${userId} OR m.receiver_id = ${userId}
    ),
    latest AS (
      SELECT DISTINCT ON (peer_id) peer_id, content, created_at, sender_id
      FROM msgs
      ORDER BY peer_id, created_at DESC
    ),
    unread AS (
      SELECT sender_id AS peer_id, COUNT(*)::int AS unread_count
      FROM public.direct_messages
      WHERE receiver_id = ${userId} AND read_at IS NULL
      GROUP BY sender_id
    )
    SELECT l.peer_id,
           p.display_name,
           p.avatar_url,
           l.content AS last_message,
           l.created_at AS last_at,
           (l.sender_id = ${userId}) AS last_from_me,
           COALESCE(u.unread_count, 0) AS unread_count,
           (
             SELECT c.name
             FROM public.community_members cm1
             JOIN public.community_members cm2
               ON cm2.community_id = cm1.community_id AND cm2.user_id = l.peer_id
             JOIN public.communities c
               ON c.id = cm1.community_id AND c.deleted_at IS NULL
             WHERE cm1.user_id = ${userId}
             LIMIT 1
           ) AS shared_community
    FROM latest l
    JOIN public.profiles p ON p.id = l.peer_id
    LEFT JOIN unread u ON u.peer_id = l.peer_id
    ORDER BY l.created_at DESC
  `;
  return rows;
}

/** Total unread DMs for the nav badge. Session-verified userId only. */
export async function getUnreadDmCount(userId: string): Promise<number> {
  const rows = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM public.direct_messages
    WHERE receiver_id = ${userId} AND read_at IS NULL
  `;
  return rows[0]?.count ?? 0;
}
