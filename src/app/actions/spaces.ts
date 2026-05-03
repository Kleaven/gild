'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createSpace as libCreateSpace,
  updateSpace as libUpdateSpace,
  deleteSpace as libDeleteSpace,
  reorderSpaces as libReorderSpaces,
} from '../../lib/community/spaces';
import type { CreateSpaceInput, UpdateSpaceInput } from '../../lib/community/types';

export async function createSpace(input: CreateSpaceInput): Promise<{ spaceId: string }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');

  const result = await libCreateSpace(input);

  revalidatePath(`/c/${input.communityId}`);

  return result;
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

  revalidatePath(`/c/${communityId}`);
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

  revalidatePath(`/c/${communityId}`);
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

  revalidatePath(`/c/${communityId}`);
}
