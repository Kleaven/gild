// server-only — do not import from client components
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type ReportStatus = Database['public']['Enums']['report_status'];

export type ReportWithReporter = ReportRow & {
  reporter: Pick<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'username'> | null;
};

/**
 * Returns the moderation queue for a given community. RLS already gates
 * to (reporter_id = auth.uid()) OR (admin of community) OR (platform_admin),
 * so a non-admin caller transparently sees only their own reports.
 *
 * Pending reports come first, then resolved (so admins can audit recent
 * actions). Joins reporter profile for display.
 */
export async function getCommunityReports(
  supabase: SupabaseClient<Database>,
  communityId: string,
  options: { status?: ReportStatus | 'all'; limit?: number } = {},
): Promise<ReportWithReporter[]> {
  const limit = options.limit ?? 100;

  let q = supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(display_name, username)')
    .eq('community_id', communityId)
    .order('status', { ascending: true })  // pending sorts first (alphabetically)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.status && options.status !== 'all') {
    q = q.eq('status', options.status);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ReportWithReporter[];
}
