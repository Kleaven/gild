'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/auth/server';

const credentialIdSchema = z.string().uuid();

export type DeleteWebAuthnKeyResult =
  | { ok: true }
  | { ok: false; code: 'not_found' | 'last_key_protected' | 'insufficient_permissions'; message: string };

/**
 * Delete a WebAuthn credential belonging to the calling platform admin.
 *
 * Last-key guard: refuses to delete the credential if it's the admin's
 * only remaining key — doing so would lock them out of the admin
 * console with no recovery path short of a manual DB bootstrap. RLS
 * already restricts to (admin_id maps to platform_admins.user_id =
 * auth.uid()) so a regular user can't delete anyone else's key, but
 * the last-key check is platform-policy on top of authorization.
 */
export async function deleteWebAuthnKey(credentialId: string): Promise<DeleteWebAuthnKeyResult> {
  if (!credentialIdSchema.safeParse(credentialId).success) {
    return { ok: false, code: 'not_found', message: 'Invalid credential id' };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, code: 'insufficient_permissions', message: 'Not authenticated' };
  }

  // Defense in depth — RLS already restricts to platform admins. The
  // explicit RPC check produces a clean error before we touch the table.
  const { data: isAdmin, error: adminErr } = await supabase.rpc('is_platform_admin');
  if (adminErr) throw new Error(adminErr.message);
  if (!isAdmin) {
    return { ok: false, code: 'insufficient_permissions', message: 'Platform admin only.' };
  }

  // Resolve the admin row for the calling user.
  const { data: adminRow, error: adminRowErr } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (adminRowErr) throw new Error(adminRowErr.message);
  if (!adminRow) {
    return { ok: false, code: 'insufficient_permissions', message: 'Platform admin row not found.' };
  }

  // Look up the credential to confirm it belongs to this admin AND check
  // total-key-count for the last-key guard in the same round-trip.
  const { data: creds, error: credErr } = await supabase
    .from('webauthn_credentials')
    .select('id')
    .eq('admin_id', adminRow.id);
  if (credErr) throw new Error(credErr.message);

  const exists = creds?.some((c) => c.id === credentialId);
  if (!exists) {
    return { ok: false, code: 'not_found', message: 'Key not found or already revoked.' };
  }

  if ((creds?.length ?? 0) <= 1) {
    return {
      ok: false,
      code: 'last_key_protected',
      message: 'You cannot delete your last security key — register a backup first.',
    };
  }

  const { error: deleteErr } = await supabase
    .from('webauthn_credentials')
    .delete()
    .eq('id', credentialId);
  if (deleteErr) {
    if (deleteErr.message.includes('row-level security')) {
      return {
        ok: false,
        code: 'insufficient_permissions',
        message: 'You do not have permission to delete this key.',
      };
    }
    throw new Error(deleteErr.message);
  }

  revalidatePath('/admin/security');
  return { ok: true };
}
