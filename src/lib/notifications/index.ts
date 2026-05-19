// server-only — do not import from client components
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

/**
 * Lists the caller's notifications, newest first. RLS already filters
 * to user_id = auth.uid() so no extra predicate needed here.
 *
 * The "show all" flag inverts the default behaviour of hiding read
 * notifications older than 30 days — useful for a "View archive"
 * toggle in the UI.
 */
export async function listNotifications(
  supabase: SupabaseClient<Database>,
  options: { limit?: number; showAll?: boolean } = {},
): Promise<NotificationRow[]> {
  const limit = options.limit ?? 100;

  let q = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!options.showAll) {
    // Default view: hide notifications that are read AND older than 30 days.
    // This keeps the inbox lean for active users without losing audit trail.
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    q = q.or(`is_read.eq.false,created_at.gte.${cutoff}`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Returns the number of unread notifications for the caller. Useful for
 * sidebar badges. RLS-scoped to current user.
 */
export async function getUnreadCount(supabase: SupabaseClient<Database>): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
