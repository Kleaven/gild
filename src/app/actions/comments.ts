'use server';

import { revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createComment as libCreateComment,
  deleteComment as libDeleteComment,
  toggleVote as libToggleVote,
} from '../../lib/comments/actions';
import type { CreateCommentInput } from '../../lib/comments/types';
import type { ReactionEmoji } from '../../lib/reactions';

export async function createComment(
  input: CreateCommentInput,
): Promise<{ commentId: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libCreateComment(input);

  revalidateTag(`post-${input.postId}`);

  return result;
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libDeleteComment(commentId);

  revalidateTag(`comment-${commentId}`);
}

export async function toggleVote(
  targetId: string,
  targetType: 'post' | 'comment',
  emoji: ReactionEmoji = '❤️',
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libToggleVote(targetId, targetType, emoji);

  revalidateTag(`${targetType}-${targetId}`);
}
