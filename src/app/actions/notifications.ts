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

// ─── Inbox mutations ─────────────────────────────────────────────────────────
// All three RLS-scoped to user_id = current_user_id() via the
// notifications_update / notifications_delete policies. The wrapper layer
// just confirms a session is present and revalidates the inbox cache.

const idSchema = z.string().uuid();

export async function markNotificationRead(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  if (!idSchema.safeParse(notificationId).success) {
    return { ok: false, error: 'Invalid notification id' };
  }
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/notifications');
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/notifications');
  return { ok: true };
}

export async function deleteNotification(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  if (!idSchema.safeParse(notificationId).success) {
    return { ok: false, error: 'Invalid notification id' };
  }
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/notifications');
  return { ok: true };
}
