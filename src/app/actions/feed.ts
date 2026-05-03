'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createPost as libCreatePost,
  deletePost as libDeletePost,
  pinPost as libPinPost,
} from '../../lib/feed/actions';
import type { CreatePostInput } from '../../lib/feed/types';

export async function createPost(input: CreatePostInput): Promise<{ postId: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libCreatePost(input);

  revalidatePath(`/c/${input.communityId}/s/${input.spaceId}`);

  return result;
}

export async function deletePost(postId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libDeletePost(postId);

  revalidateTag(`post-${postId}`);
}

export async function pinPost(postId: string, pin: boolean): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libPinPost(postId, pin);

  revalidateTag(`post-${postId}`);
}
