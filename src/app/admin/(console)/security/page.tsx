import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getSupabaseServerClient } from '@/lib/auth/server';
import SecurityKeysClient from './SecurityKeysClient';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  await requirePlatformAdmin();
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  // Resolve the admin row for this user, then fetch all keys via RLS-gated SELECT.
  const { data: adminRow } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: credentials } = adminRow
    ? await supabase
        .from('webauthn_credentials')
        .select('id, credential_id, friendly_name, device_type, backed_up, transports, last_used_at, created_at')
        .eq('admin_id', adminRow.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <div className="px-8 py-10 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Security keys</h1>
        <p className="text-sm text-neutral-400 max-w-prose">
          Your WebAuthn credentials are the only way to authenticate into this
          admin console. Register at least two keys — losing your only one
          means recovery requires direct database access.
        </p>
      </header>

      <SecurityKeysClient credentials={credentials ?? []} />
    </div>
  );
}
