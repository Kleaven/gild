import 'server-only';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../auth/server';
import { isPlatformAdmin } from '../permissions/platform';

export async function requirePlatformAdmin(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const isAdmin = await isPlatformAdmin(user.id);
  if (!isAdmin) {
    redirect('/');
  }
}
