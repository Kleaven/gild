// Reaction primitives + aggregation helper.
// fetchReactionsMap is server-only (uses the supabase client), but the
// emoji whitelist + types must be safe to import from both client and
// server modules — and from 'use server' files, which forbid non-async
// exports. Keeping plain consts/types here works because this file has
// no 'use server' directive.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';

export const REACTION_EMOJI_WHITELIST = ['❤️', '👍', '🎉', '😂', '😮', '😢'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI_WHITELIST)[number];

export function isReactionEmoji(value: string): value is ReactionEmoji {
  return (REACTION_EMOJI_WHITELIST as readonly string[]).includes(value);
}

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
