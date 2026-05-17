'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { resolveCommunitySlug } from '../../lib/community/context';
import {
  createSpace as libCreateSpace,
  updateSpace as libUpdateSpace,
  deleteSpace as libDeleteSpace,
  reorderSpaces as libReorderSpaces,
} from '../../lib/community/spaces';
import type { CreateSpaceInput, UpdateSpaceInput } from '../../lib/community/types';

// Routes live at /c/[slug] — every revalidatePath in this file translates
// the UUID we receive from the client into the active slug before invalidating.
// See lib/community/context.ts:resolveCommunitySlug (React-cached).

export async function createSpace(input: CreateSpaceInput): Promise<{ spaceId?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { error: '[gild] not authenticated' };

    const result = await libCreateSpace(input);

    const slug = await resolveCommunitySlug(input.communityId);
    revalidatePath(`/c/${slug}`);

    return result;
  } catch (err) {
    console.error('[createSpace] action error:', err);
    return { error: err instanceof Error ? err.message : 'Failed to create space' };
  }
}

// communityId is a wrapper-only param — UpdateSpaceInput does not carry it
export async function updateSpace(
  spaceId: string,
  input: UpdateSpaceInput,
  communityId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libUpdateSpace(spaceId, input);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
}

// communityId is a wrapper-only param — lib deleteSpace takes only spaceId
export async function deleteSpace(spaceId: string, communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libDeleteSpace(spaceId);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
}

export async function reorderSpaces(
  communityId: string,
  orderedSpaceIds: string[],
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  await libReorderSpaces(communityId, orderedSpaceIds);

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}`);
}
