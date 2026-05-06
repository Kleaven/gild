import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/auth/server';
import { StudioLanding } from './StudioLanding';

export default async function RootPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Redirect to first community, or show CTA if none
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .neq('role', 'banned')
      .limit(1);

    const firstMembership = memberships?.[0];
    if (firstMembership) {
      redirect(`/c/${firstMembership.community_id}`);
    }

    return (
      <main style={{ 
        maxWidth: 480, 
        margin: '80px auto', 
        padding: '0 16px', 
        textAlign: 'center',
        fontFamily: 'var(--font-inter), system-ui, sans-serif' 
      }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: 700,
          fontFamily: 'var(--font-bricolage), sans-serif',
          letterSpacing: '-0.02em'
        }}>Welcome to Gild</h1>
        <p style={{ color: '#666', marginBottom: 32, fontSize: 16 }}>
          You&apos;re not part of any community yet.
        </p>
        <Link
          href="/communities/new"
          style={{
            display: 'inline-block',
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Create your first community
        </Link>
      </main>
    );
  }

  // Landing for unauthenticated visitors
  return <StudioLanding />;
}
