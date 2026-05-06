'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { exportUserData, deleteUserAccount } from '@/lib/privacy';
import type { UserDataExport } from '@/lib/privacy';

export async function requestDataExport(): Promise<{
  data: UserDataExport | null;
  error: string | null;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };
    const data = await exportUserData(user.id);
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return { data: null, error: message };
  }
}

export async function requestAccountDeletion(): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  try {
    await deleteUserAccount(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deletion failed';
    return { error: message };
  }

  redirect('/');
}
