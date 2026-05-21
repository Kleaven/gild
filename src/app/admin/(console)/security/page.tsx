import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
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
    <div style={{ padding: '40px 32px', maxWidth: 768 }}>
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: 4,
            color: GILD_ADMIN_TOKENS.text.primary,
            fontFamily: GILD_FONTS.display,
          }}
        >
          Security keys
        </h1>
        <p
          style={{
            fontSize: 14,
            color: GILD_ADMIN_TOKENS.text.muted,
            maxWidth: '65ch',
            lineHeight: 1.5,
          }}
        >
          Your WebAuthn credentials are the only way to authenticate into this
          admin console. Register at least two keys — losing your only one
          means recovery requires direct database access.
        </p>
      </header>

      <SecurityKeysClient credentials={credentials ?? []} />
    </div>
  );
}
