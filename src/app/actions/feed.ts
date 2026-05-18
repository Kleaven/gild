'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createPost as libCreatePost,
  deletePost as libDeletePost,
  pinPost as libPinPost,
  voteInPoll as libVoteInPoll,
} from '../../lib/feed/actions';
import type { CreatePostInput } from '../../lib/feed/types';

// Routes are keyed by slug, not UUID — revalidatePath('/c/<uuid>/...') is a
// dead path that Next happily accepts and then silently does nothing useful.
// Resolve slug from the UUID input so the cache key actually matches a route.
async function communitySlugForCacheKey(communityId: string): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('communities')
    .select('slug')
    .eq('id', communityId)
    .maybeSingle();
  return data?.slug ?? null;
}

export async function createPost(input: CreatePostInput): Promise<{ postId?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { error: '[gild] not authenticated' };

    const result = await libCreatePost(input);
    const slug = await communitySlugForCacheKey(input.communityId);
    if (slug) revalidatePath(`/c/${slug}/s/${input.spaceId}`);
    return result;
  } catch (err) {
    console.error('[createPost] action error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create post' };
  }
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

// slug + spaceId are wrapper-only args used to build the precise cache key.
// Old impl was `revalidatePath('/', 'layout')` which nuked the entire app's
// layout cache for every vote — thermonuclear. We now only invalidate the
// specific post route the vote lives under, plus the parent feed (so
// vote-count badges on the feed list refresh too).
export async function voteInPoll(
  postId: string,
  optionId: string,
  communitySlug: string,
  spaceId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libVoteInPoll(postId, optionId);

  revalidatePath(`/c/${communitySlug}/s/${spaceId}/p/${postId}`);
  revalidatePath(`/c/${communitySlug}/s/${spaceId}`);
}
