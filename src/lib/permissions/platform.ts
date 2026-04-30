// server-only — do not import from client components
import { getSupabaseServiceClient } from '../auth/server';

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  // platform_admins is locked to service role — use service client to bypass RLS.
  const serviceClient = getSupabaseServiceClient();
  const { data } = await serviceClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  return data !== null;
}
