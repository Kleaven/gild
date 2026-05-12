'use server';

import { getSupabaseServerClient } from '@/lib/auth/server';
import { revalidatePath } from 'next/cache';

export async function updateMemberPermissions(
  communityId: string,
  userId: string,
  permissions: Record<string, boolean>
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  // 1. Verify caller is the owner
  const { data: isOwner } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId
  });

  if (!isOwner) {
    throw new Error('[gild] only the community owner can configure granular admin privileges');
  }

  // 2. Update permissions
  const { error } = await supabase
    .from('community_members')
    .update({ permissions })
    .eq('community_id', communityId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/c/${communityId}/members`);
}
