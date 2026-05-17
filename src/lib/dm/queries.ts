// server-only — do not import from client components
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type { DirectMessage, RecipientProfile } from './types';

const DEFAULT_LIMIT = 50;

/**
 * Loads the most recent N messages between the caller and `otherUserId`.
 * RLS guarantees the caller is either sender or receiver — no extra check
 * needed at the query layer. Returned chronologically (oldest → newest)
 * so the UI can append-render without reversing.
 */
export async function getConversation(
  supabase: SupabaseClient<Database>,
  otherUserId: string,
  options: { limit?: number } = {},
): Promise<DirectMessage[]> {
  const limit = options.limit ?? DEFAULT_LIMIT;

  // Pair predicate: caller is one side, otherUserId is the other.
  // We rely on RLS for the "caller is sender or receiver" half — the OR
  // here is the "otherUserId is the OTHER end" filter.
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  // Reverse to chronological order for append-render.
  return (data ?? []).reverse();
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
