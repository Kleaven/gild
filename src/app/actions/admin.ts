'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getCommunityOverridesForFlag } from '@/lib/admin';
import type { FlagName } from '@/lib/feature-flags';

export async function setGlobalFlag(
  flagName: FlagName,
  enabled: boolean,
): Promise<{ error: string | null }> {
  await requirePlatformAdmin();
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('feature_flags')
    .upsert(
      { community_id: null, flag_name: flagName, is_enabled: enabled },
      { onConflict: 'community_id,flag_name' },
    );
  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { error: null };
}

export async function setCommunityFlag(
  communityId: string,
  flagName: FlagName,
  enabled: boolean,
): Promise<{ error: string | null }> {
  await requirePlatformAdmin();
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('feature_flags')
    .upsert(
      { community_id: communityId, flag_name: flagName, is_enabled: enabled },
      { onConflict: 'community_id,flag_name' },
    );
  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { error: null };
}

export async function clearCommunityFlagOverride(
  communityId: string,
  flagName: FlagName,
): Promise<{ error: string | null }> {
  await requirePlatformAdmin();
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('feature_flags')
    .delete()
    .eq('community_id', communityId)
    .eq('flag_name', flagName);
  if (error) return { error: error.message };
  revalidatePath('/admin/flags');
  return { error: null };
}

export async function getOverridesForFlag(
  flagName: FlagName,
): Promise<{
  data: Array<{ communityId: string; communityName: string; enabled: boolean }> | null;
  error: string | null;
}> {
  try {
    await requirePlatformAdmin();
    const overrides = await getCommunityOverridesForFlag(flagName);
    return { data: overrides, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: message };
  }
}
