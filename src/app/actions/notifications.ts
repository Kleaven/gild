'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/auth/server';

const setBroadcastOptOutSchema = z.object({
  communityId: z.string().uuid(),
  optOut: z.boolean(),
});

export async function setBroadcastOptOut(
  input: { communityId: string; optOut: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = setBroadcastOptOutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }
  const { communityId, optOut } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: 'Not authenticated' };
  }

  // RLS on community_members restricts UPDATE to platform admins. Use the
  // SECURITY DEFINER RPC which scopes the update to auth.uid() server-side.
  const { error } = await supabase.rpc('set_broadcast_opt_out', {
    p_community_id: communityId,
    p_opt_out: optOut,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/settings/notifications');
  return { ok: true };
}
