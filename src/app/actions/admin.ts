'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';
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

export async function initializeInfrastructure(): Promise<{ ok: boolean; message: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: 'Not authenticated' };

  // Check if platform admin
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (!isAdmin) return { ok: false, message: 'Not authorized' };

  const serviceClient = getSupabaseServiceClient();
  const buckets = ['media', 'avatars', 'branding'];
  let createdCount = 0;

  for (const bucketName of buckets) {
    const { data: bucket, error: getError } = await serviceClient.storage.getBucket(bucketName);
    
    if (getError && (getError as any).message?.includes('not found')) {
      const { error: createError } = await serviceClient.storage.createBucket(bucketName, {
        public: true,
      });
      if (!createError) createdCount++;
    }
  }

  revalidatePath('/admin/health');
  return { ok: true, message: `Infrastructure check complete. Created ${createdCount} missing buckets.` };
}
