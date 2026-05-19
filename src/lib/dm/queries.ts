// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { DirectMessage, RecipientProfile } from './types';

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
