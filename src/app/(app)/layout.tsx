import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { Wordmark } from '@/components/gild';
import { getUserCommunities } from '@/lib/community/queries';
import { GlobalNav } from '@/components/gild/GlobalNav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const communities = await getUserCommunities(supabase, user.id);
  const displayName = profile?.display_name ?? user.email ?? 'Account';

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid oklch(0.94 0.005 250 / 0.6)',
          background: 'oklch(1 0 0 / 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <GlobalNav 
          user={{
            id: user.id,
            display_name: displayName,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null
          }} 
          communities={communities} 
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#555' }}>{displayName}</span>
          <Link
            href="/communities"
            style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}
          >
            Discover
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}
          >
            Inbox
          </Link>
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
