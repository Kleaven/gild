'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { rateLimit } from '../rate-limit/index';
import type { CreatePostInput } from './types';

const createPostSchema = z.object({
  communityId: z.string().uuid(),
  spaceId: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  body: z.string().min(1).max(50000),
});

export async function createPost(input: CreatePostInput): Promise<{ postId: string }> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { communityId, spaceId, title, body } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await rateLimit.postCreate(user.id);
  if (!rl.allowed) throw new Error('[gild] rate limit exceeded');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'free_member',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] not a member of this community');

  const { data: space, error: spaceError } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', spaceId)
    .eq('community_id', communityId)
    .maybeSingle();
  if (spaceError) throw new Error(spaceError.message);
  if (!space) throw new Error('[gild] space not found in community');

  const { data: post, error: insertError } = await supabase
    .from('posts')
    .insert({
      community_id: communityId,
      space_id: spaceId,
      author_id: user.id,
      title: title ?? null,
      body,
    })
    .select('id')
    .single();
  if (insertError) throw new Error(insertError.message);

  return { postId: post.id };
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('delete_post', { p_post_id: postId });
  if (error) throw new Error(error.message);
}

export async function pinPost(postId: string, pin: boolean): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('community_id')
    .eq('id', postId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!post) throw new Error('[gild] post not found');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: post.community_id,
    p_min_role: 'moderator',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] insufficient permissions to pin post');

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: pin })
    .eq('id', postId);
  if (error) throw new Error(error.message);
}
