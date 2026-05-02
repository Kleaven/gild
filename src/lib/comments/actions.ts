'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { rateLimit } from '../rate-limit/index';
import type { CreateCommentInput } from './types';

const createCommentSchema = z.object({
  postId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  body: z.string().min(1).max(5000),
});

export async function createComment(input: CreateCommentInput): Promise<{ commentId: string }> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { postId, parentId, body } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await rateLimit.commentCreate(user.id);
  if (!rl.allowed) throw new Error('[gild] rate limit exceeded');

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, community_id')
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle();
  if (postError) throw new Error(postError.message);
  if (!post) throw new Error('[gild] post not found or deleted');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: post.community_id,
    p_min_role: 'free_member',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] not a member of this community');

  if (parentId !== null) {
    const { data: parent, error: parentError } = await supabase
      .from('comments')
      .select('post_id, parent_id')
      .eq('id', parentId)
      .maybeSingle();
    if (parentError) throw new Error(parentError.message);
    if (!parent) throw new Error('[gild] parent comment not found');
    if (parent.post_id !== postId) throw new Error('[gild] parent comment belongs to a different post');
    if (parent.parent_id !== null) throw new Error('[gild] nested replies beyond one level are not allowed');
  }

  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      community_id: post.community_id,
      author_id: user.id,
      parent_id: parentId,
      body,
    })
    .select('id')
    .single();
  if (insertError) throw new Error(insertError.message);

  return { commentId: comment.id };
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('delete_comment', { p_comment_id: commentId });
  if (error) throw new Error(error.message);
}

export async function toggleVote(
  targetId: string,
  targetType: 'post' | 'comment',
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  let communityId: string;
  if (targetType === 'post') {
    const { data: post, error } = await supabase
      .from('posts')
      .select('community_id')
      .eq('id', targetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) throw new Error('[gild] post not found');
    communityId = post.community_id;
  } else {
    const { data: comment, error } = await supabase
      .from('comments')
      .select('community_id')
      .eq('id', targetId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!comment) throw new Error('[gild] comment not found');
    communityId = comment.community_id;
  }

  const { error } = await supabase.rpc('toggle_vote', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
}
