import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/auth/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const activeUser = user || {
    id: 'mock-user-id',
    email: 'sandbox@gild.app',
  };

  const { data: profile } = user 
    ? await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
    : { data: { display_name: 'Sandbox User' } };

  const displayName = profile?.display_name ?? activeUser.email ?? 'Account';

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #eee',
          background: '#fff',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, textDecoration: 'none', color: '#000' }}>
          Gild
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#555' }}>{displayName}</span>
          <Link
            href="/communities/new"
            style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}
          >
            New community
          </Link>
        </div>
      </nav>
      {children}
    </>
  );
}
