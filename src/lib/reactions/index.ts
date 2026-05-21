// server-only — aggregates reactions for posts / comments via the
// get_reactions_for_targets RPC so feed / comment-list renders can fetch
// every target's reactions in a single round-trip instead of N+1.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export type ReactionTally = {
  emoji: string;
  count: number;
  viewerReacted: boolean;
};

export type ReactionsByTarget = Record<string, ReactionTally[]>;

export async function fetchReactionsMap(
  supabase: SupabaseClient<Database>,
  targetType: 'post' | 'comment',
  targetIds: string[],
): Promise<ReactionsByTarget> {
  if (targetIds.length === 0) return {};

  const { data, error } = await supabase.rpc('get_reactions_for_targets', {
    p_target_type: targetType,
    p_target_ids: targetIds,
  });
  if (error) throw new Error(error.message);

  const result: ReactionsByTarget = {};
  for (const row of data ?? []) {
    const bucket = result[row.target_id] ?? (result[row.target_id] = []);
    bucket.push({
      emoji: row.emoji,
      count: Number(row.count),
      viewerReacted: row.viewer_reacted,
    });
  }
  return result;
}
