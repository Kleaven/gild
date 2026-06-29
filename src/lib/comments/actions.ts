'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { rateLimit } from '../rate-limit/index';
import { normalizeRole, canRolePerform } from '../permissions/roles';
import { assertFlag } from '../feature-flags';
import { isReactionEmoji, type ReactionEmoji } from '../reactions';
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
    .select('id, community_id, space_id, spaces(permissions)')
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

  // ─── Permission Check ──────────────────────────────────────────────────────
  // Space-level AND community-level permissions, resolved against the caller's
  // actual role. Either layer can deny commenting.
  const space = (post as { spaces?: { permissions?: Record<string, string> | null } | null }).spaces;
  const { data: callerRole, error: callerRoleErr } = await supabase.rpc('current_user_role', {
    p_community_id: post.community_id,
  });
  if (callerRoleErr) throw new Error(callerRoleErr.message);
  const role = normalizeRole(callerRole);

  const { data: communityRow } = await supabase
    .from('communities')
    .select('role_permissions')
    .eq('id', post.community_id)
    .maybeSingle();

  if (
    !canRolePerform(space?.permissions, role, 'comment') ||
    !canRolePerform(communityRow?.role_permissions, role, 'comment')
  ) {
    throw new Error('[gild] commenting is limited in this space — ask a moderator if you think this is a mistake');
  }

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('[gild] not authenticated');

  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('author_id, created_at, community_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) throw new Error('[gild] comment not found');

  const isAuthor = comment.author_id === user.id;
  const { data: isModerator } = await supabase.rpc('user_has_min_role', {
    p_community_id: comment.community_id,
    p_min_role: 'moderator',
  });

  if (!isAuthor && !isModerator) {
    throw new Error('[gild] insufficient permissions to delete this comment');
  }

  if (isAuthor && !isModerator) {
    const hoursSinceCreation = (Date.now() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 5) {
      throw new Error('[gild] comments can only be deleted within the first 5 hours of posting');
    }
  }

  const { error } = await supabase.rpc('delete_comment', { p_comment_id: commentId });
  if (error) throw new Error(error.message);
}

export async function updateComment(commentId: string, body: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('[gild] not authenticated');

  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('author_id, created_at, community_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) throw new Error('[gild] comment not found');

  const isAuthor = comment.author_id === user.id;
  const { data: isModerator } = await supabase.rpc('user_has_min_role', {
    p_community_id: comment.community_id,
    p_min_role: 'moderator',
  });

  if (!isAuthor && !isModerator) {
    throw new Error('[gild] insufficient permissions to edit this comment');
  }

  if (isAuthor && !isModerator) {
    const hoursSinceCreation = (Date.now() - new Date(comment.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 5) {
      throw new Error('[gild] comments can only be edited within the first 5 hours of posting');
    }
  }

  const { error: updateError } = await supabase
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId);

  if (updateError) throw new Error(updateError.message);
}

export async function toggleVote(
  targetId: string,
  targetType: 'post' | 'comment',
  emoji: ReactionEmoji = '❤️',
): Promise<void> {
  if (!isReactionEmoji(emoji)) {
    throw new Error('[gild] unsupported reaction emoji');
  }

  const supabase = await getSupabaseServerClient();

  let communityId: string;
  if (targetType === 'post') {
    const { data: post, error } = await supabase
      .from('posts')
      .select('community_id, space_id')
      .eq('id', targetId)
      .maybeSingle();
    
    if (error || !post) throw new Error('[gild] post not found');
    communityId = post.community_id;

    const { data: space } = await supabase
      .from('spaces')
      .select('permissions')
      .eq('id', post.space_id)
      .single();
    
    const requiredRole = normalizeRole((space?.permissions as Record<string, string> | undefined)?.react);
    const { data: hasPerm } = await supabase.rpc('user_has_min_role', {
      p_community_id: communityId,
      p_min_role: requiredRole,
    });
    if (!hasPerm) throw new Error(`Insufficient permissions to react in this space. Required: ${requiredRole}`);
  } else {
    const { data: comment, error } = await supabase
      .from('comments')
      .select('community_id, post_id')
      .eq('id', targetId)
      .maybeSingle();
    
    if (error || !comment) throw new Error('[gild] comment not found');
    communityId = comment.community_id;

    const { data: parentPost } = await supabase
      .from('posts')
      .select('space_id')
      .eq('id', comment.post_id)
      .single();

    if (!parentPost) throw new Error('[gild] parent post not found');

    const { data: targetSpace } = await supabase
      .from('spaces')
      .select('permissions')
      .eq('id', parentPost.space_id)
      .single();

    const requiredRole = normalizeRole((targetSpace?.permissions as Record<string, string> | undefined)?.react);
    const { data: hasPerm } = await supabase.rpc('user_has_min_role', {
      p_community_id: communityId,
      p_min_role: requiredRole,
    });
    if (!hasPerm) throw new Error(`Insufficient permissions to react in this space. Required: ${requiredRole}`);
  }

  // Gate emoji reactions on the flag — '❤️' (default) is the legacy "like"
  // path, which must keep working regardless of the flag. Any other emoji
  // requires the reactions feature to be enabled for the community.
  if (emoji !== '❤️') {
    await assertFlag('reactions', communityId);
  }

  const { error } = await supabase.rpc('toggle_vote', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_community_id: communityId,
    p_emoji: emoji,
  });
  if (error) throw new Error(error.message);
}
