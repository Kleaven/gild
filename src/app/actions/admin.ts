'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/auth/server';
import { revalidatePath } from 'next/cache';
import { resolveCommunitySlug } from '@/lib/community/context';
import type { FlagName } from '@/lib/feature-flags/flags';

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

  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/members`);
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
    const { error: getError } = await serviceClient.storage.getBucket(bucketName);
    
    if (getError && (getError as { message?: string }).message?.includes('not found')) {
      const { error: createError } = await serviceClient.storage.createBucket(bucketName, {
        public: true,
      });
      if (!createError) createdCount++;
    }
  }

  revalidatePath('/admin/health');
  return { ok: true, message: `Infrastructure check complete. Created ${createdCount} missing buckets.` };
}

export async function setGlobalFlag(flagName: FlagName, isEnabled: boolean) {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (!isAdmin) return { error: 'Not authorized' };

  const { error } = await supabase
    .from('feature_flags')
    .upsert({ 
      community_id: null, 
      flag_name: flagName, 
      is_enabled: isEnabled 
    }, { onConflict: 'community_id,flag_name' });

  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { ok: true };
}

export async function setCommunityFlag(communityId: string, flagName: FlagName, isEnabled: boolean) {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (!isAdmin) return { error: 'Not authorized' };

  const { error } = await supabase
    .from('feature_flags')
    .upsert({ 
      community_id: communityId, 
      flag_name: flagName, 
      is_enabled: isEnabled 
    }, { onConflict: 'community_id,flag_name' });

  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { ok: true };
}

export async function clearCommunityFlagOverride(communityId: string, flagName: FlagName) {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (!isAdmin) return { error: 'Not authorized' };

  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('community_id', communityId)
    .eq('flag_name', flagName);

  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { ok: true };
}

export async function getOverridesForFlag(flagName: FlagName) {
  const supabase = await getSupabaseServerClient();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  if (!isAdmin) return { error: 'Not authorized' };

  const { data, error } = await supabase
    .from('feature_flags')
    .select(`
      community_id,
      is_enabled,
      communities (
        name
      )
    `)
    .eq('flag_name', flagName)
    .not('community_id', 'is', null);

  if (error) return { error: error.message };

  const result = (data || []).map((row: { community_id: string | null; communities: { name: string | null } | null; is_enabled: boolean }) => ({
    communityId: row.community_id ?? "",
    communityName: row.communities?.name || 'Unknown',
    enabled: row.is_enabled
  }));

  return { data: result };
}
